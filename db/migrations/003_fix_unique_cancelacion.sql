-- db/migrations/003_fix_unique_cancelacion.sql
-- Elimina la restricción UNIQUE global en pedido_id y la reemplaza por un índice UNIQUE condicional
-- para permitir múltiples solicitudes siempre y cuando no haya una activa ('solicitada').

ALTER TABLE solicitudes_cancelacion DROP CONSTRAINT solicitudes_cancelacion_pedido_id_key;

CREATE UNIQUE INDEX idx_cancelacion_una_activa
ON solicitudes_cancelacion (pedido_id)
WHERE estado = 'solicitada';
