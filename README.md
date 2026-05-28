# Missão 5S: Ideias que Transformam

Plataforma gamificada para evento de 5S na Funilaria de uma indústria automotiva.

O colaborador acessa pelo celular ou desktop, cadastra nome, matrícula e turno, lança ideias de melhoria com foto do local, acumula pontos e sobe no ranking. Não é quiz.

## 1. Objetivo do projeto

Criar uma campanha digital 5S com aparência oficial, fluxo simples em campo e painel administrativo separado para acompanhamento, status, bônus, exportação e limpeza dos dados do evento.

Frase principal: **Viu uma oportunidade de melhoria? Registre sua ideia!**

## 2. Tecnologias usadas

- Phaser 4 para a camada visual gamificada.
- Vite para desenvolvimento e build.
- JavaScript, HTML e CSS.
- Firebase JavaScript SDK modular.
- Firebase Realtime Database.
- Firebase Storage.
- Firebase Authentication para o admin.
- Vercel para publicação.
- GitHub para versionamento.

## 3. Como instalar

```bash
npm install
```

## 4. Como rodar localmente

```bash
npm run dev
```

Depois abra a URL exibida no terminal, normalmente `http://localhost:5173`.

## 5. Como fazer build

```bash
npm run build
```

Para conferir a versão de produção:

```bash
npm run preview
```

## 6. Como publicar na Vercel

1. Suba o projeto para um repositório GitHub.
2. Na Vercel, escolha **Add New Project**.
3. Importe o repositório.
4. Framework: **Vite**.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Publique.

## 7. Como configurar Firebase

Crie um projeto no Firebase Console e ative:

- Realtime Database.
- Storage.
- Authentication com provedor **Email/Password**.

## 8. Como ativar Realtime Database

No Firebase Console:

1. Acesse **Build > Realtime Database**.
2. Clique em **Create Database**.
3. Escolha uma região.
4. Comece em modo bloqueado e aplique as regras recomendadas abaixo.

## 9. Como ativar Storage

No Firebase Console:

1. Acesse **Build > Storage**.
2. Clique em **Get started**.
3. Comece em modo bloqueado.
4. Aplique as regras recomendadas de Storage.

## 10. Como ativar Authentication

No Firebase Console:

1. Acesse **Build > Authentication**.
2. Clique em **Get started**.
3. Em **Sign-in method**, ative **Email/Password**.

## 11. Como criar usuário admin

No Firebase Console:

1. Acesse **Authentication > Users**.
2. Clique em **Add user**.
3. Informe e-mail e senha.
4. Use esse e-mail e senha em `admin.html`.

Não existe senha fixa no JavaScript.

## 12. Onde colar firebaseConfig

Cole as credenciais em [src/firebase.js](src/firebase.js), no objeto:

```js
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};
```

Enquanto esse objeto estiver vazio, o app abre visualmente e mostra o aviso de que o Firebase ainda não foi configurado.

## 13. Regras recomendadas do Realtime Database

Use como ponto de partida para evento interno controlado:

```json
{
  "rules": {
    "participants": {
      ".read": true,
      "$matricula": {
        ".write": "auth != null || (!data.exists() || newData.child('matricula').val() === $matricula)",
        ".validate": "newData.hasChildren(['nome','matricula','turno','totalIdeias','totalPontos','ultimaParticipacao','criadoEm']) && newData.child('matricula').val() === $matricula && newData.child('nome').isString() && newData.child('turno').isString() && newData.child('totalIdeias').isNumber() && newData.child('totalPontos').isNumber()"
      }
    },
    "ideas": {
      ".read": "auth != null",
      "$ideaId": {
        ".write": "auth != null || (!data.exists() && newData.child('status').val() === 'Recebida' && newData.child('pontos').val() === 15 && newData.child('bonusStatus').child('aprovada').val() === false && newData.child('bonusStatus').child('implantada').val() === false)",
        ".validate": "newData.hasChildren(['id','nome','matricula','turno','titulo','descricao','senso','area','fotoUrl','fotoPath','status','pontos','bonusStatus','dataHora','atualizadoEm'])"
      }
    }
  }
}
```

Para segurança corporativa forte, o ideal é usar Cloud Functions para validar pontuação no servidor. Esta versão é adequada para evento interno controlado.

## 14. Regras recomendadas do Storage

O app público precisa enviar a imagem e obter `downloadURL`. O arquivo pronto está em `storage.rules`.

Para evento interno controlado, publique estas regras no Firebase Storage:

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /ideas/{matricula}/{fileName} {
      allow read: if true;

      allow write: if request.auth != null || (
        resource == null
        && request.resource != null
        && matricula.matches('^[0-9]+$')
        && request.resource.size <= 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*')
      );
    }
  }
}
```

Em ambiente corporativo mais rígido, prefira autenticação do participante ou Cloud Functions para gerar uploads controlados.

Se o navegador mostrar erro de CORS no upload da foto, configure CORS no bucket do Storage. O arquivo pronto está em `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "x-firebase-gmpid",
      "x-firebase-storage-version",
      "x-goog-upload-command",
      "x-goog-upload-header-content-length",
      "x-goog-upload-header-content-type",
      "x-goog-upload-protocol",
      "x-goog-upload-status",
      "x-goog-upload-url"
    ],
    "maxAgeSeconds": 3600
  }
]
```

Aplicação via Google Cloud CLI ou Cloud Shell:

```bash
gcloud storage buckets update gs://missao-5s.firebasestorage.app --cors-file=cors.json
```

Se o Firebase Console mostrar outro bucket, substitua `missao-5s.firebasestorage.app` pelo nome exibido em **Storage > Files**.

## 15. Como acessar admin.html

O painel administrativo fica em:

```text
/admin.html
```

Não há link para `admin.html` dentro da tela pública.

## 16. Como adicionar áudios

Substitua os placeholders em [assets/audio](assets/audio):

- `musica-fundo.mp3`
- `ideia-enviada.mp3`
- `ranking.mp3`
- `top3.mp3`
- `continue-participando.mp3`

O áudio só inicia após interação do usuário. Se um arquivo estiver ausente ou inválido, o app continua funcionando.

## 17. Como testar envio de ideia

1. Configure Firebase.
2. Rode `npm run dev`.
3. Entre na missão.
4. Cadastre nome completo, matrícula numérica e turno.
5. Clique em **Lançar Nova Ideia**.
6. Preencha título, descrição, senso, área e foto.
7. Envie.
8. Confira `/ideas` e `/participants` no Realtime Database e a foto em Storage.

## 18. Como testar ranking

1. Envie ideias com matrículas diferentes.
2. Abra **Ver Ranking**.
3. O ranking agrupa por matrícula e ordena por:
   1. maior total de ideias;
   2. maior total de pontos;
   3. participação mais antiga em caso de empate.

Nome nunca é usado como chave única.

## 19. Como exportar CSV

1. Acesse `/admin.html`.
2. Entre com usuário criado no Firebase Authentication.
3. Clique em **Exportar CSV**.

O CSV inclui nome, matrícula, turno, título, descrição, senso, área, status, pontos, fotoUrl e dataHora.

## 20. Como limpar dados

No admin, clique em **Limpar dados do evento** e confirme:

> Tem certeza que deseja apagar todos os dados do evento? Essa ação não poderá ser desfeita.

O sistema remove:

- `participants`
- `ideas`
- fotos conhecidas em `fotoPath`, quando as regras de Storage permitirem

Sem backend administrativo, o front-end não lista fotos órfãs que não estejam mais referenciadas no banco.

## 21. Observações de segurança

- Não há senha administrativa fixa no JavaScript.
- Admin usa Firebase Authentication por e-mail e senha.
- O painel admin só carrega dados quando há usuário autenticado.
- O público não precisa ler `/ideas`; o ranking público usa `/participants`.
- Regras abertas não devem ser usadas em produção.
- Pontuação no front-end é suficiente para evento interno controlado, mas validação forte deve ir para Cloud Functions.

## 22. Como gerar QR Code do link da Vercel

Depois de publicar:

1. Copie a URL pública da Vercel.
2. Use um gerador de QR Code corporativo aprovado pela empresa.
3. Aponte o QR Code para a URL do app, não para `/admin.html`.
4. Teste o QR Code em Android e iPhone antes do evento.
