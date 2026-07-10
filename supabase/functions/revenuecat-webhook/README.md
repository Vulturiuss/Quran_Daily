# RevenueCat webhook

Cette fonction synchronise les entitlements RevenueCat vers
`profiles.subscription_tier`. Elle est nécessaire pour autoriser les opérations
familiales côté serveur après un achat mobile.

## Déploiement

```powershell
supabase secrets set `
  REVENUECAT_WEBHOOK_AUTHORIZATION="Bearer UNE_CLE_LONGUE_ET_ALEATOIRE" `
  REVENUECAT_SECRET_API_KEY="sk_..." `
  REVENUECAT_PREMIUM_ENTITLEMENT="premium" `
  REVENUECAT_FAMILY_ENTITLEMENT="family"

supabase functions deploy revenuecat-webhook --no-verify-jwt
```

Dans RevenueCat, ajoute un webhook vers :

```text
https://<PROJECT_REF>.supabase.co/functions/v1/revenuecat-webhook
```

Configure le même en-tête `Authorization` que
`REVENUECAT_WEBHOOK_AUTHORIZATION`.

La fonction relit l’état courant du client via l’API RevenueCat avant chaque
mise à jour. Les appels répétés et les webhooks livrés dans le désordre restent
donc sans effet cumulatif.
