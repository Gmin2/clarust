(define-read-only (max-of (a uint) (b uint))
  (if (> a b) a b))
(define-read-only (min-of (a uint) (b uint))
  (if (< a b) a b))
