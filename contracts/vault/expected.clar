(define-map deposits principal uint)
(define-public (deposit (amount uint))
  (let ((who tx-sender))
    (let ((current (default-to u0 (map-get? deposits who))))
      (begin
        (map-set deposits who (+ current amount))
        (ok (+ current amount))))))
(define-public (withdraw (amount uint))
  (let ((who tx-sender))
    (let ((current (default-to u0 (map-get? deposits who))))
      (begin
        (asserts! (>= current amount) (err u1))
        (begin
          (map-set deposits who (- current amount))
          (ok (- current amount)))))))
(define-read-only (balance-of (who principal))
  (default-to u0 (map-get? deposits who)))
