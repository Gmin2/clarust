(define-map balances principal uint)
(define-public (deposit (amount uint))
  (let ((who tx-sender))
    (let ((current (default-to u0 (map-get? balances who))))
      (begin
        (map-set balances who (+ current amount))
        (ok (+ current amount))))))
(define-read-only (balance-of (who principal))
  (default-to u0 (map-get? balances who)))
