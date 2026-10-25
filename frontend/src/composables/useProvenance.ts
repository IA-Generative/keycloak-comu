/**
 * La provenance d'une visite venue d'une autre application (Mes collections, …) qui demande la
 * création d'un groupe : `?q=<nom>` (nom proposé), `?creer=1` (aller droit au bouton de création)
 * et `?retour=<url>` (où revenir ensuite). Gardée en sessionStorage : la connexion OIDC fait perdre
 * la query, et la création se termine sur la page du groupe, pas sur celle de la recherche.
 */
import { computed, ref } from 'vue'

export interface Provenance {
  q: string
  creer: boolean
  retour: string
}

const CLE = 'comu.provenance'
const vide: Provenance = { q: '', creer: false, retour: '' }

function lire(): Provenance {
  try {
    const brut = sessionStorage.getItem(CLE)
    return brut ? { ...vide, ...JSON.parse(brut) } : { ...vide }
  } catch {
    return { ...vide }
  }
}

const etat = ref<Provenance>(lire())

/** Retient ce que l'adresse d'arrivée dit ; ce qui y manque garde la valeur déjà retenue. */
export function retenirProvenance(search: string): Provenance {
  const p = new URLSearchParams(search)
  const q = (p.get('q') || '').trim()
  const retour = (p.get('retour') || '').trim()
  const creer = p.get('creer') === '1'
  if (!q && !retour && !creer) return etat.value
  etat.value = { q: q || etat.value.q, creer: creer || etat.value.creer, retour: retour || etat.value.retour }
  try {
    sessionStorage.setItem(CLE, JSON.stringify(etat.value))
  } catch {
    /* sans stockage, la provenance ne survit pas à la connexion : rien de grave */
  }
  return etat.value
}

export function oublierProvenance(): void {
  etat.value = { ...vide }
  try {
    sessionStorage.removeItem(CLE)
  } catch {
    /* ignore */
  }
}

/** L'adresse de retour si son origine est autorisée (https, dans la liste du serveur), sinon ''. */
export function retourAutorise(retour: string, origines: readonly string[] | undefined): string {
  if (!retour) return ''
  try {
    const u = new URL(retour)
    if (u.protocol !== 'https:') return ''
    return (origines || []).map(o => o.replace(/\/+$/, '')).includes(u.origin) ? u.toString() : ''
  } catch {
    return ''
  }
}

/** Le nom lisible de l'application de retour : son hôte, sans « www. ». */
export function nomDuRetour(retour: string): string {
  try {
    return new URL(retour).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function useProvenance() {
  return { provenance: computed(() => etat.value), retenirProvenance, oublierProvenance, retourAutorise, nomDuRetour }
}
