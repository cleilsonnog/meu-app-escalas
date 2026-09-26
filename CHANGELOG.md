# Changelog

Todas as mudancas notaveis deste projeto serao documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-09-26

### Adicionado
- Validacao com Zod em todas as server actions
- Testes unitarios com Vitest (29 testes cobrindo validacoes e controle de acesso)
- Helpers centralizados de tenant filtering (`ownerWhere`, `volunteerWhere`, `eventWhere`)
- Funcao `sendWhatsAppFireAndForget` para notificacoes nao-bloqueantes
- Pagina `/dashboard/status` com info de versao, rotas, changelog e health check
- Arquivo `.npmrc` para compatibilidade de deploy na Vercel

### Corrigido
- Isolamento multi-tenant no `eventos.ts` (usava `auth()` direto sem filtro de owner)
- Queries sem limite retornando todos os registros (adicionado `take` e janela de datas)
- Proximo culto em destaque mostrando evento antigo em vez do futuro
- Erros de TypeScript com discriminated union narrowing em todos os componentes
- Campo `funcaoEspecifica` com acento causando problemas de encoding

### Alterado
- Reorganizacao de `components/ui/dashboard/` para `components/dashboard/` com subpasta `modals/`
- Dashboard carrega dados condicionalmente por tab via searchParams
- Versao bumped de 0.1.0 para 1.0.0
