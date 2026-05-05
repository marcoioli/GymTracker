# Change Proposal: GymTracker Batch 6 Local Backup

## Why

GymTracker ya es usable, pero sigue teniendo un riesgo fuerte: todos los datos viven solo en el storage local del navegador. Si el usuario limpia datos, cambia de dispositivo o el navegador se rompe, pierde rutinas, historial y progreso.

## What Changes

### Batch 6 — Backup y restore local
- Exportar todos los datos relevantes del producto a un archivo JSON.
- Importar un backup local validando estructura mínima y versión.
- Permitir restauración completa de datos en el dispositivo.
- Proteger al usuario con confirmaciones claras antes de sobrescribir información.

## Capabilities

This change will introduce the following capabilities:
- `local-backup-export`
- `local-backup-import`
- `backup-validation-and-restore`

## Impacted Areas

- Local persistence layer
- Settings or utility actions in UI
- Data validation and restore flow

## Risks

- Si la importación sobrescribe datos sin confirmación clara, el usuario puede perder información valiosa.
- Si el backup no incluye versión o estructura consistente, futuras restauraciones se vuelven frágiles.
- Si exportamos datos parciales, el restore puede dejar el producto en estado inconsistente.

## Rollback Plan

- Mantener export e import aislados del flujo central de entrenamiento.
- Si el restore genera inconsistencias, permitir revertir el cambio deshabilitando solo la UI de import mientras se conserva export.
