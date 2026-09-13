# ideias YOFI CORPORATE

- [ ] Adicionar sistema de receitas recorrentes,
- [ ] ciclo de capital,
- [ ] melhor assistência para salário
- [ ] melhor assistência para custos recorrentes
- [ ] Adicionar diversos "Tipos" de negócio
- [ ] Painel ADM para dono da empresa

# Anotações básicas

- [ ] Quando for compactar para capacitor, atualize o CORS
- [ ] Adicionar Captcha
- [ ] Verificação por email pra criar a conta
- [ ] Definir funcionalidades novas da mya no YOFI corporate
- [ ] Definir definitivamente novas funcionalidades do YOFI corporate
- [ ] Adicionar Propagandas futuramente
- [ ] Adicionar autentificação com Microsoft
- [ ] Adicionar autentificação com Aplle
- [ ] Adicionar sistema de leitura de notificações no android
- [ ] Adicionar Models no Schemas e as rotas na Rotas além de noti

# 🔐 Melhorias de Segurança — YOFI

- [ ] Implementar proteção contra CSRF, principalmente por usar cookies com `SameSite=None`.
- [ ] Adicionar Rate Limiting nos endpoints de login, cadastro e principalmente `/mya`.
- [ ] Validar rigorosamente todos os dados recebidos pelo frontend usando Pydantic.
- [ ] Adicionar expiração/rotação adequada para tokens e sessões.
- [ ] Implementar logout com invalidação adequada da sessão quando necessário.
- [ ] Adicionar headers de segurança HTTP, como CSP, HSTS e `X-Content-Type-Options`.
- [ ] Adicionar logs de segurança para tentativas suspeitas de login e acesso.

# 🔐 Melhorias de Segurança Bem Futuras

- [ ] Biometria com andorid studio
- [ ] Pin com android studio
- [ ] Facial com android studio
- [ ] Vai ter versão apple? faceID

# 🗂️ Possível Separação do banco.py

## 1. Estrutura principal

Backend/
│
├── principais/
│ ├── main.py
│ ├── banco.py  
│ │
│ ├── auth/
│ │ ├── login.py
│ │ ├── cadastro.py
│ │ └── google.py
│ │
│ ├── rotas/
│ │ ├── contas.py
│ │ ├── cartoes.py
│ │ ├── transacoes.py
│ │ ├── dashboard.py
│ │ ├── objetivos.py
│ │ ├── orcamentos.py
│ │ ├── notificacoes.py
│ │ ├── categorias.py
│ │ └── mya.py
│ │
│ │
│ └── utils/
│ ├── autenticacao.py
│ ├── seguranca.py
│ └── validacoes.py
│
└── requirements.txt
