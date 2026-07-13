# send-family-nudge

Un parent demande au serveur d’envoyer un rappel bienveillant à son enfant.

La fonction reçoit `{ "childUserId": "<uuid>" }` d’un client **authentifié**, crée
un client Supabase avec le JWT de l’appelant (jamais le service role) et appelle
`request_family_nudge(child_user_id)`. C’est la RPC — et elle seule — qui vérifie
que l’appelant est bien parent de cet enfant dans une famille active, applique la
limite d’un rappel toutes les 6 heures, et renvoie les tokens push.

Le parent ne voit jamais le token de l’enfant : il demande un rappel, il ne reçoit
pas le moyen d’en envoyer un quand il veut.

## Réponses

| Réponse                                | Sens                                             |
| -------------------------------------- | ------------------------------------------------ |
| `200 { sent: true, delivered: n }`      | Rappel envoyé à `n` appareils.                   |
| `200 { sent: false, reason: 'rate_limited' }` | Un rappel a déjà été envoyé il y a moins de 6 h. |
| `200 { sent: false, reason: 'no_device' }`    | L’enfant n’a pas activé les notifications. |
| `403 { reason: 'forbidden' }`          | L’appelant n’est pas parent de cet enfant.       |

`rate_limited` et `no_device` répondent 200 : ce sont des réponses, pas des
erreurs, et l’app doit pouvoir le dire avec douceur.

## Déploiement

```powershell
supabase functions deploy send-family-nudge
```

Le JWT est vérifié (pas de `--no-verify-jwt`) : la fonction n’a de sens que
pour un appelant authentifié. `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont fournis
automatiquement par la plateforme, aucun secret supplémentaire n’est nécessaire.

Prérequis côté base : les tables `push_tokens` et `family_nudges` et la fonction
`request_family_nudge` (fin de `supabase/schema.sql`).

## Appel depuis l’app

```ts
supabase.functions.invoke('send-family-nudge', { body: { childUserId } });
```

Voir `src/services/family.ts` → `sendFamilyNudge()`.
