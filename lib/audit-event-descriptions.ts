import type { Locale } from "@/lib/i18n";

const descriptions = {
  en: {
    "transaction.created": "Created a transaction",
    "transaction.updated": "Updated a transaction",
    "transaction.approved": "Approved a transaction",
    "transaction.rejected": "Rejected a transaction",
    "transaction.voided": "Voided a transaction",
    "reconciliation.started": "Started a bank reconciliation",
    "reconciliation.updated": "Updated a bank reconciliation",
    "reconciliation.completed": "Completed a bank reconciliation",
    "reconciliation.cancelled": "Cancelled a bank reconciliation",
    "member.added": "Added an organization member",
    "member.updated": "Updated an organization member",
    "member.role_changed": "Changed a member’s role",
    "member.deactivated": "Deactivated a member’s access",
    "member.reactivated": "Restored a member’s access",
  },
  es: {
    "transaction.created": "Creó una transacción",
    "transaction.updated": "Actualizó una transacción",
    "transaction.approved": "Aprobó una transacción",
    "transaction.rejected": "Rechazó una transacción",
    "transaction.voided": "Anuló una transacción",
    "reconciliation.started": "Inició una conciliación bancaria",
    "reconciliation.updated": "Actualizó una conciliación bancaria",
    "reconciliation.completed": "Completó una conciliación bancaria",
    "reconciliation.cancelled": "Canceló una conciliación bancaria",
    "member.added": "Agregó un miembro de la organización",
    "member.updated": "Actualizó un miembro de la organización",
    "member.role_changed": "Cambió el rol de un miembro",
    "member.deactivated": "Desactivó el acceso de un miembro",
    "member.reactivated": "Restauró el acceso de un miembro",
  },
} as const;

export function getAuditEventDescription(locale: Locale, action: string) {
  const localized = descriptions[locale] as Record<string, string>;
  return localized[action] ?? (locale === "es" ? "Realizó un cambio en el sistema" : "Made a system change");
}
