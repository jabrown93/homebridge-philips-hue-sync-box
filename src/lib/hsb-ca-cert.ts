// Root CA that signs every Hue Sync Box's HTTPS leaf certificate. Shared across
// all Sync Box devices (baked into the firmware) - it is not specific to any one
// box, so it authenticates "a genuine Sync Box" rather than "this exact device".
// Source: https://developers.meethue.com/wp-content/uploads/2020/01/hsb_cacert.pem_.txt
// Documented at: https://developers.meethue.com/develop/hue-entertainment/hue-hdmi-sync-box-api/#HTTPS
export const HSB_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIBwDCCAWagAwIBAgIBATAKBggqhkjOPQQDAjA2MQswCQYDVQQGEwJOTDEUMBIG
A1UECgwLUGhpbGlwcyBIdWUxETAPBgNVBAMMCHJvb3QtaHNiMCAXDTE3MDEwMTAw
MDAwMFoYDzk5OTkxMjMxMjM1OTU5WjA2MQswCQYDVQQGEwJOTDEUMBIGA1UECgwL
UGhpbGlwcyBIdWUxETAPBgNVBAMMCHJvb3QtaHNiMFkwEwYHKoZIzj0CAQYIKoZI
zj0DAQcDQgAEr9FgOxnsonsrnUZr3C4ggST7YCR9wISvDuwlNdZcAz4HiVCNmAAP
tAnAFDG0U19Rmc4MfRYBMO8GrOHrOkZ7sKNjMGEwHQYDVR0OBBYEFCK+VIWZqp++
DHqmGLWEZHYdH9v7MB8GA1UdIwQYMBaAFCK+VIWZqp++DHqmGLWEZHYdH9v7MA8G
A1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0gAMEUC
IAFDI0Q4IOPxV7cY4wSVOJAn4y5AdZwrItJ1XuNpmCltAiEA5c6wcu6qmF596uyA
r7xLnr3/F5zJxrE3AyLD4t+5oKs=
-----END CERTIFICATE-----
`;
