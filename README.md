# TreinoPro - Plataforma Inteligente de Treino (PWA)

Plataforma moderna de prescrição e acompanhamento de treinos para musculação, desenvolvida como um **PWA (Progressive Web App)** com suporte a **offline-first**, **motor de IA (Google Gemini)** e **dois perfis de acesso (Aluno e Professor/Personal)**.

---

## 🚀 Principais Funcionalidades

### 📱 Experiência do Aluno
1. **Anamnese Inteligente:** Questionário rápido com objetivo (Hipertrofia, Emagrecimento, Força, Condicionamento), experiência, frequência semanal (2 a 6x), tempo por sessão e limitações físicas (dores no joelho, coluna/lombar, ombro, etc.).
2. **Geração de Treino com IA:** Divisão clássica ajustada automaticamente com proteção articular e sugestão de exercícios alternativos caso o aparelho principal esteja ocupado.
3. **Modo Academia (Execução em Tempo Real):**
   * Registro fácil de peso (kg) e repetições série a série.
   * **Timer de Descanso Flutuante:** Aciona automaticamente ao marcar a série como feita (com aviso sonoro e tátil/vibração).
   * **Botão "Substituto":** Mostra na hora o que fazer caso a máquina esteja ocupada.
4. **Histórico e Evolução:** Resumo da sessão, tempo total, séries feitas e feedback de intensidade pós-treino (com chuva de confetes 🎉).

### 🏋️ Painel do Professor / Personal
1. **Gestão de Alunos:** Lista com objetivos, limitações físicas e frequência semanal de cada aluno.
2. **Código de Convite Único:** Ex: `RODRIGO10` para os alunos inserirem no cadastro e se vincularem automaticamente.
3. **Copiloto IA para o Professor:**
   * Botões de atalho: *"Trocar exercícios livres por máquinas seguras"*, *"Diminuir volume de pernas e reforçar peitoral"*, etc.
   * Prompt livre para a IA refinar o treino.
4. **Editor Completo de Treino:** Adicionar/remover divisões (A, B, C...), exercícios, ajustar séries, repetições, descanso e publicar diretamente no celular do aluno.
5. **Histórico de Execução:** Acompanhamento das sessões concluídas e observações deixadas pelos alunos.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
* **PWA / Offline:** `vite-plugin-pwa` + Service Workers + Cache Local
* **Banco de Dados & Autenticação:**
  * **Firebase Firestore & Auth** (com persistência IndexedDB offline ativa)
  * **Modo Local Integrado:** O app funciona 100% de imediato mesmo sem credenciais do Firebase, usando armazenamento local reativo para demonstrações e testes.
* **Inteligência Artificial:**
  * **Google Gemini API** (`gemini-1.5-flash` com saída JSON estruturada)
  * **Motor Cinesiológico Algorítmico Integrado:** Garante que mesmo sem internet ou sem chave de API, treinos biomecanicamente coerentes sejam gerados na hora.

---

## 💻 Como Rodar o Projeto

1. Instalar dependências (caso clonado do zero):
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abrir o link indicado no navegador (geralmente `http://localhost:5173`).

---

## 🔑 Configuração de Variáveis de Ambiente (Opcional)

Copie o arquivo `.env.example` para `.env` e preencha as chaves:

```env
# Firebase (Opcional: ativa nuvem realtime)
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Google Gemini (Opcional: ativa IA generativa direta do Google)
VITE_GEMINI_API_KEY=sua_chave_do_google_ai_studio
```
