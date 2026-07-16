-- db/migrations/004_pagos_mp_payment_unique.sql
-- Agrega restricción UNIQUE en mp_payment_id para que el webhook pueda usar
-- ON CONFLICT al procesar el mismo pago_id de MercadoPago más de una vez.

ALTER TABLE pagos ADD CONSTRAINT pagos_mp_payment_id_unique UNIQUE (mp_payment_id);
