'use client'

import { Anchor, ClipboardList, MapPin, Plus, Trash2, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import type { DrayagePort, Location } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import { lookupZip } from '@/services/geo'
import { CONTAINER_TYPES, LBS_PER_KG, checkDrayageDestination, type ContainerTypeId, type DrayageQuoteInput } from '@/services/quotes'
import s from './drayage.module.css'

interface Line {
  key: number
  containerType: ContainerTypeId
  weight: string
  weightUnit: 'LBS' | 'KGS'
  description: string
}

type Errors = Partial<Record<'port' | 'terminal' | 'zip' | 'city' | 'state', string>> & { weights?: Record<number, string> }

const portKey = (p: DrayagePort) => `${p.city.toUpperCase()}, ${p.state}`
const maxOf = (c: ContainerTypeId) => CONTAINER_TYPES.find((x) => x.id === c)!.maxLbs
const toLbs = (l: Line) => (l.weightUnit === 'KGS' ? Number(l.weight) * LBS_PER_KG : Number(l.weight))
const isOverweight = (l: Line) => Number(l.weight) > 0 && toLbs(l) > maxOf(l.containerType)

const newLine = (key: number, containerType: ContainerTypeId = '20'): Line => ({ key, containerType, weight: '', weightUnit: 'LBS', description: '' })

/** /quotes/drayage form — same fields as the old FCL quote page: Origin, Destination, Accessorials, Shipment Information. */
export function DrayageQuoteForm({ ports, portsState, onRetryPorts, initialPortId, initialZip, initialContainer, loading, onSubmit }: {
  ports?: DrayagePort[]
  portsState: 'loading' | 'error' | 'ready'
  onRetryPorts: () => void
  initialPortId?: string
  initialZip?: string
  initialContainer?: ContainerTypeId
  loading: boolean
  onSubmit: (input: DrayageQuoteInput) => void
}) {
  const { t, lang } = useI18n()
  const [terminalId, setTerminalId] = useState<string>()
  const [zip, setZip] = useState(initialZip ?? '')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [dest, setDest] = useState<Location>()
  const [zipStatus, setZipStatus] = useState<'idle' | 'loading' | 'notFound'>('idle')
  const [residential, setResidential] = useState(false)
  const [moreAcc, setMoreAcc] = useState(false)
  // Keys start at 0 on server and client alike, so the static HTML hydrates cleanly.
  const lineSeq = useRef(1)
  const [lines, setLines] = useState<Line[]>(() => [newLine(0, initialContainer)])
  const [direction, setDirection] = useState<'IMPORT' | 'EXPORT'>('IMPORT')
  const [other, setOther] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  // Default terminal: dashboard prefill, else Los Angeles, else the first one.
  const terminal = ports?.find((p) => p.id === terminalId) ?? ports?.find((p) => p.id === initialPortId) ?? ports?.find((p) => p.city === 'Los Angeles') ?? ports?.[0]
  const portGroups = useMemo(() => {
    const groups = new Map<string, DrayagePort[]>()
    for (const p of ports ?? []) groups.set(portKey(p), [...(groups.get(portKey(p)) ?? []), p])
    return groups
  }, [ports])
  const currentPort = terminal ? portKey(terminal) : ''
  const terminals = portGroups.get(currentPort) ?? []
  // Overweight is set automatically when any container is over its class limit (old form behaviour).
  const overweight = lines.some(isOverweight)

  // ZIP → city / state (terminal-specific lookup first, generic geocode as fallback). Stale replies are ignored.
  const lookupSeq = useRef(0)
  const lookup = (value: string, term?: DrayagePort) => {
    const seq = ++lookupSeq.current
    if (!/^\d{5}$/.test(value)) {
      setDest(undefined)
      setZipStatus('idle')
      return
    }
    setZipStatus('loading')
    void Promise.all([lookupZip(value), term ? checkDrayageDestination(value, term.id).catch(() => undefined) : undefined]).then(([loc, chk]) => {
      if (seq !== lookupSeq.current) return
      if (!loc && !chk?.city) {
        setDest(undefined)
        setZipStatus('notFound')
        return
      }
      const next: Location = { zip: value, country: 'US', city: chk?.city ?? loc!.city, state: chk?.state ?? loc!.state, point: loc?.point }
      setDest(next)
      setCity(next.city)
      setState(next.state)
      setZipStatus('idle')
      setErrors((e) => ({ ...e, zip: undefined, city: undefined, state: undefined }))
    })
  }

  // Dashboard prefill: resolve the ZIP once the terminal list is in.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !terminal || !initialZip) return
    const id = setTimeout(() => {
      prefilled.current = true
      lookup(initialZip, terminal)
    })
    return () => clearTimeout(id)
  }, [terminal, initialZip])

  const setLine = (key: number, patch: Partial<Line>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
    setErrors((e) => ({ ...e, weights: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!terminal) next.port = t('quotes.form.required')
    if (!zip) next.zip = t('quotes.form.required')
    else if (!/^\d{5}$/.test(zip) || zipStatus === 'notFound') next.zip = t('quotes.form.zipUnresolved')
    if (!city.trim()) next.city = t('quotes.form.required')
    if (!state.trim()) next.state = t('quotes.form.required')
    const weights: Record<number, string> = {}
    for (const l of lines) if (l.weight && !(Number(l.weight) > 0)) weights[l.key] = t('quotes.form.positive')
    if (Object.keys(weights).length) next.weights = weights
    setErrors(next)
    if (next.port || next.zip || next.city || next.state || next.weights || !terminal) {
      const first = (['port', 'zip', 'city', 'state'] as const).find((k) => next[k])
      if (first) document.getElementById(`dray-${first}`)?.focus()
      return
    }
    onSubmit({
      port: terminal,
      destination: { ...(dest ?? { zip, country: 'US' }), city: city.trim(), state: state.trim().toUpperCase() },
      containers: lines.map((l) => ({
        containerType: l.containerType,
        weight: Number(l.weight) > 0 ? Number(l.weight) : undefined,
        weightUnit: l.weightUnit,
        description: l.description.trim() || undefined,
      })),
      direction,
      residentialDelivery: residential,
      overweight,
      other: other.trim() || undefined,
    })
  }

  const unavailable = portsState !== 'ready'
  const placeholder = [{ value: '', label: portsState === 'loading' ? t('quotes.dray.portsLoading') : t('quotes.dray.portsError') }]
  const portOptions = unavailable ? placeholder : [...portGroups.keys()].map((k) => ({ value: k, label: k }))
  const terminalOptions = unavailable ? placeholder : terminals.map((p) => ({ value: p.id, label: p.terminal }))

  return (
    <form className={s.form} onSubmit={submit} noValidate aria-label={t('quotes.dray.title')}>
      <div className={s.twoCol}>
        <Card className={s.block}>
          <CardHeader as="h3" icon={<Anchor size={20} />} title={t('quotes.dray.origin')} />
          <div className={s.fields2}>
            <Field
              label={t('quotes.dray.port')}
              required
              htmlFor="dray-port"
              error={errors.port ?? (portsState === 'error' ? <button type="button" className={s.linkBtn} onClick={onRetryPorts}>{t('quotes.dray.portsRetry')}</button> : undefined)}
            >
              <Select
                id="dray-port"
                value={currentPort}
                disabled={unavailable}
                invalid={!!errors.port}
                options={portOptions}
                onChange={(e) => {
                  setTerminalId(portGroups.get(e.target.value)?.[0]?.id)
                  setErrors((x) => ({ ...x, port: undefined }))
                }}
              />
            </Field>
            <Field label={t('quotes.dray.terminal')} required htmlFor="dray-terminal">
              <Select id="dray-terminal" value={terminal?.id ?? ''} disabled={unavailable} options={terminalOptions} onChange={(e) => setTerminalId(e.target.value)} />
            </Field>
          </div>
          {terminal?.location && <p className={s.note}>{terminal.location}</p>}
        </Card>

        <Card className={s.block}>
          <CardHeader as="h3" icon={<MapPin size={20} />} title={t('quotes.dray.destination')} />
          <div className={s.fields2}>
            <Field label={t('quotes.dray.zip')} required htmlFor="dray-zip" error={errors.zip ?? (zipStatus === 'notFound' ? t('quotes.form.zipUnresolved') : undefined)}>
              <Input
                id="dray-zip"
                inputMode="numeric"
                maxLength={5}
                placeholder={t('quotes.dray.zipPh')}
                value={zip}
                invalid={!!errors.zip || zipStatus === 'notFound'}
                trailing={zipStatus === 'loading' ? <span className={s.spinner} aria-hidden /> : undefined}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setZip(v)
                  lookup(v, terminal)
                }}
              />
            </Field>
            <Field label={t('quotes.dray.city')} required htmlFor="dray-city" error={errors.city}>
              <Input id="dray-city" value={city} invalid={!!errors.city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label={t('quotes.dray.state')} required htmlFor="dray-state" error={errors.state}>
              <Input id="dray-state" value={state} maxLength={2} invalid={!!errors.state} onChange={(e) => setState(e.target.value.replace(/[^a-z]/gi, '').toUpperCase())} />
            </Field>
            <Field label={t('quotes.dray.country')} required htmlFor="dray-country">
              <Select id="dray-country" value="US" disabled options={[{ value: 'US', label: t('quotes.dray.countryUs') }]} />
            </Field>
          </div>
        </Card>
      </div>

      <Card className={s.block}>
        <CardHeader
          as="h3"
          icon={<ClipboardList size={20} />}
          title={t('quotes.dray.accessorials')}
          action={
            <Button size="sm" variant="secondary" aria-expanded={moreAcc} onClick={() => setMoreAcc((m) => !m)}>
              {moreAcc ? t('quotes.dray.less') : t('quotes.dray.more')}
            </Button>
          }
        />
        <div className={s.checks}>
          <Checkbox label={t('quotes.accessorial.ResidentialDelivery')} checked={residential} onChange={(e) => setResidential(e.target.checked)} />
          {moreAcc && <Checkbox label={t('quotes.accessorial.Overweight')} checked={overweight} disabled readOnly title={t('quotes.dray.overweightAuto')} />}
        </div>
        {moreAcc && <p className={s.note}>{t('quotes.dray.overweightAuto')}</p>}
      </Card>

      <Card className={s.block}>
        <CardHeader
          as="h3"
          icon={<Truck size={20} />}
          title={t('quotes.dray.shipmentInfo')}
          action={
            <Button size="sm" variant="secondary" leading={<Plus size={16} />} onClick={() => setLines((ls) => [...ls, newLine(lineSeq.current++)])}>
              {t('quotes.dray.add')}
            </Button>
          }
        />
        <div className={s.lines}>
          {lines.map((l, i) => {
            const max = maxOf(l.containerType)
            const id = `dray-line-${l.key}`
            return (
              <div key={l.key} className={s.line}>
                <Field label={t('quotes.dray.class')} required htmlFor={`${id}-class`}>
                  <Select
                    id={`${id}-class`}
                    value={l.containerType}
                    options={CONTAINER_TYPES.map((c) => ({ value: c.id, label: t(c.labelKey) }))}
                    onChange={(e) => setLine(l.key, { containerType: e.target.value as ContainerTypeId })}
                  />
                </Field>
                <Field
                  label={t('quotes.form.weight')}
                  htmlFor={`${id}-weight`}
                  error={errors.weights?.[l.key]}
                  hint={t('quotes.dray.maxWeight', { lbs: fmtNumber(max, lang), kgs: fmtNumber(Math.round(max / LBS_PER_KG), lang) })}
                >
                  <Input
                    id={`${id}-weight`}
                    inputMode="decimal"
                    value={l.weight}
                    invalid={!!errors.weights?.[l.key] || isOverweight(l)}
                    onChange={(e) => setLine(l.key, { weight: e.target.value.replace(/[^\d.]/g, '') })}
                  />
                </Field>
                <Field label={t('quotes.dray.units')} htmlFor={`${id}-units`}>
                  <Select
                    id={`${id}-units`}
                    value={l.weightUnit}
                    options={[{ value: 'LBS', label: 'LBS' }, { value: 'KGS', label: 'KGS' }]}
                    onChange={(e) => setLine(l.key, { weightUnit: e.target.value as Line['weightUnit'] })}
                  />
                </Field>
                <Field label={t('quotes.more.description')} htmlFor={`${id}-desc`}>
                  <Input id={`${id}-desc`} value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} />
                </Field>
                <div className={s.lineAction}>
                  {lines.length > 1 && (
                    <Button
                      iconOnly
                      variant="ghost"
                      aria-label={t('quotes.dray.removeLine', { n: i + 1 })}
                      title={t('quotes.dray.removeLine', { n: i + 1 })}
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
                {isOverweight(l) && <p className={s.warn}>{t('quotes.dray.overMax', { lbs: fmtNumber(max, lang) })}</p>}
              </div>
            )
          })}
        </div>
        <div className={s.jobRow}>
          <Field label={t('quotes.dray.jobType')} required htmlFor="dray-job">
            <Select
              id="dray-job"
              value={direction}
              options={[{ value: 'IMPORT', label: t('quotes.dray.import') }, { value: 'EXPORT', label: t('quotes.dray.export') }]}
              onChange={(e) => setDirection(e.target.value as 'IMPORT' | 'EXPORT')}
            />
          </Field>
          <Field label={t('quotes.dray.other')} htmlFor="dray-other">
            <Input id="dray-other" value={other} placeholder={t('quotes.dray.otherPh')} onChange={(e) => setOther(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div>
        <Button type="submit" size="lg" loading={loading} disabled={unavailable} className={s.submit}>
          {t('quotes.dray.getQuote')}
        </Button>
      </div>
    </form>
  )
}
