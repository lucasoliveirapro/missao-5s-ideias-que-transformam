# Instrucoes para o Codex

Este projeto e uma aplicacao industrial para ranking de cartoes SS Z2/Z3/Z4 exportados do Manusis4.

## Regras de negocio

- Z2 = Cartao AM.
- Z3 = Fonte de sujeira / dificil acesso.
- Z4 = PM.
- Cartoes AM = Z2 + Z3.
- Cartoes PM = Z4.
- Total geral = Z2 + Z3 + Z4.
- A tela principal e o Top 3 dos condutores por total geral.
- Usar "Numero" como chave unica da SS.
- Usar "Data criacao" como data do ranking.
- Usar "Usuario" como nome principal do condutor.
- Usar "Assunto principal" para extrair Z2/Z3/Z4.
- Ignorar Z1 neste MVP.

## Seguranca

- Nunca expor service_role no frontend.
- Nunca commitar .env.
- Nunca commitar exports reais .xlsx.
- Nunca commitar fotos reais.
- RLS deve permanecer ativo.
- Toda API sensivel deve verificar sessao e papel.
- Toda importacao deve ocorrer no backend.
- Upload deve validar extensao, MIME, tamanho e estrutura.
- Fotos devem usar bucket privado e signed URL.
- Nao usar bucket publico para fotos.

## Qualidade

- TypeScript estrito.
- Componentes pequenos.
- Codigo limpo.
- Validacao com Zod.
- Testar lint e build antes de finalizar.
- Atualizar README quando criar ou alterar comportamento.
