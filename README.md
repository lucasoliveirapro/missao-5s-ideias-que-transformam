# Missão 5S: Caça às Anomalias

Jogo web para evento de 5S no galpão de Funilaria de uma indústria automotiva. O participante identifica situações reais da rotina, escolhe o senso correto e acumula pontos em um ranking online centralizado.

O jogo coleta nome, matrícula, turno e pontuação apenas para controle do ranking do evento.

## Estrutura

- `index.html`: jogo público, cadastro, instruções, partida, resultado e ranking.
- `admin.html`: painel administrativo protegido por senha temporária.
- `style.css`: identidade visual responsiva.
- `script.js`: regras do jogo, validação, Firebase, áudio e ranking público.
- `admin.js`: senha administrativa, ranking completo, exportação CSV e limpeza de dados.
- `assets/audio/`: pasta para os arquivos `.mp3` gerados no ElevenLabs.

## Como Executar Localmente

Abra o arquivo `index.html` no navegador ou use um servidor estático simples. Com Python instalado:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

Sem Firebase configurado, o jogo funciona em modo local no próprio dispositivo. O ranking online centralizado e o painel administrativo dependem do `firebaseConfig`.

## Como Criar o Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Adicionar projeto**.
3. Dê um nome ao projeto.
4. Desative ou mantenha o Google Analytics conforme a política do evento.
5. Finalize a criação.

## Como Ativar o Realtime Database

1. No menu do Firebase, abra **Build > Realtime Database**.
2. Clique em **Criar banco de dados**.
3. Escolha a região.
4. Para teste inicial, inicie em modo de teste.

## Onde Colar o firebaseConfig

No arquivo `script.js`, preencha este bloco. Repita as mesmas credenciais no arquivo `admin.js` para o painel administrativo:

```js
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
```

As credenciais ficam em **Configurações do projeto > Geral > Seus apps > SDK setup and configuration**.

## Regras Iniciais do Firebase Para Teste

Use apenas durante teste controlado do evento:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Para uso definitivo, proteja escrita, leitura e considere trocar a senha temporária do painel administrativo por autenticação Firebase.

## Dados Salvos no Firebase

Participantes agregados por matrícula:

```text
/participants/{matricula}
```

Histórico de partidas:

```text
/attempts/{attemptId}
```

O ranking soma todos os pontos por matrícula. Em caso de empate, ordena por maior quantidade de partidas, melhor pontuação em uma partida e quem atingiu primeiro a pontuação.

## Como Publicar na Vercel

1. Crie uma conta em [Vercel](https://vercel.com/).
2. Crie um novo projeto.
3. Envie esta pasta ou conecte o repositório Git.
4. Publique como site estático.
5. Copie o link final.
6. Gere o QR Code a partir do link publicado.

## Como Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Suba os arquivos `index.html`, `admin.html`, `style.css`, `script.js`, `admin.js`, `README.md` e a pasta `assets/audio/`.
3. Abra **Settings > Pages**.
4. Selecione a branch e a pasta raiz.
5. Salve e aguarde o link do GitHub Pages.
6. Gere o QR Code a partir do link publicado.

## Como Gerar QR Code

Depois de publicar, copie o link final do jogo e use um gerador de QR Code confiável. Teste o QR Code em celular Android e iPhone antes do evento.

## Como Adicionar os Áudios do ElevenLabs

Gere os arquivos no ElevenLabs e coloque os `.mp3` em:

```text
assets/audio/
```

Arquivos suportados:

- `musica-fundo.mp3`
- `inicio-missao.mp3`
- `voce-acertou.mp3`
- `muito-bem.mp3`
- `resposta-rapida.mp3`
- `voce-errou.mp3`
- `tempo-esgotado.mp3`
- `nova-rodada.mp3`
- `fim-partida.mp3`
- `subiu-ranking.mp3`
- `top3.mp3`
- `jogar-novamente.mp3`
- `olhar-critico.mp3`
- `padrao-5s.mp3`
- `funilaria-em-ordem.mp3`
- `continue-praticando.mp3`

Se algum áudio não existir, o jogo continua funcionando normalmente.

## Textos Recomendados Para Gerar no ElevenLabs

Prompt de estilo para voz:

```text
Fale em português do Brasil, com tom animado, claro e motivacional, como um apresentador de evento corporativo dentro de uma fábrica automotiva. A voz deve transmitir energia, segurança e competição saudável, sem parecer infantil. Fale de forma curta, objetiva e com boa dicção.
```

Prompt para erro:

```text
Fale em português do Brasil, com tom firme, educativo e respeitoso. A mensagem deve orientar o jogador sem constranger.
```

Textos:

- `inicio-missao.mp3`: “Missão iniciada! Observe a situação e escolha o senso correto.”
- `voce-acertou.mp3`: “Você acertou!”
- `muito-bem.mp3`: “Muito bem! Esse é o espírito do 5S.”
- `resposta-rapida.mp3`: “Excelente! Resposta rápida!”
- `voce-errou.mp3`: “Você errou. Observe melhor a situação.”
- `tempo-esgotado.mp3`: “Tempo esgotado! Atenção ao padrão.”
- `nova-rodada.mp3`: “Nova rodada!”
- `fim-partida.mp3`: “Missão concluída!”
- `subiu-ranking.mp3`: “Parabéns! Você subiu no ranking do 5S.”
- `top3.mp3`: “Parabéns! Você entrou no Top 3 do desafio.”
- `jogar-novamente.mp3`: “Jogue novamente e acumule mais pontos.”
- `olhar-critico.mp3`: “Olhar crítico ativado! Encontre a anomalia.”
- `padrao-5s.mp3`: “5S é padrão todos os dias.”
- `funilaria-em-ordem.mp3`: “Funilaria em ordem é segurança, qualidade e produtividade.”
- `continue-praticando.mp3`: “Continue praticando. O 5S começa na atitude de cada um.”

## Painel Administrativo

O jogo público não exibe link para a administração. Para acessar o painel, abra diretamente:

```text
https://seu-link-publicado/admin.html
```

Senha temporária:

```text
5S2026
```

## Como Exportar CSV

Abra `admin.html`, informe a senha e clique em **Exportar CSV**. O arquivo gerado será:

```text
resultados-missao-5s.csv
```

O CSV usa os dados de `/attempts` no Firebase.

## Como Limpar Dados

No `admin.html`, clique em **Limpar dados**. O painel pedirá confirmação antes de apagar:

- `/participants`
- `/attempts`

Essa ação não pode ser desfeita.

## Próximas Melhorias Possíveis

- Trocar a senha temporária por autenticação Firebase.
- Criar painel separado para projetor do evento.
- Adicionar perguntas por área da fábrica.
- Registrar tempo médio por resposta.
- Exportar também o ranking agregado.
- Adicionar modo treinamento sem ranking.
