# Daggerheart: Distâncias

Um utilitário visual e intuitivo para o sistema **Daggerheart** no Foundry VTT. Exibe automaticamente anéis de distância (Corpo a Corpo, Muito Perto, Perto, Longe) ao redor dos tokens e calcula as distâncias entre personagens instantaneamente, ajudando jogadores e MJs a visualizar os alcances de combate sem precisar medir manualmente.

<video src="https://github.com/user-attachments/assets/c6e6a905-9cd4-4666-b742-9719f91a0a7b" 
       controls 
       width="720"
       autoplay 
       loop 
       muted></video>

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-red?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/mestredigital)

## 🌟 Funcionalidades Principais

### 📏 Para Todos (Jogadores e MJ)

* **Anéis de Alcance Visual:** Veja instantaneamente as 4 faixas de alcance principais do Daggerheart:

  * **Corpo a Corpo:** 1,5 m (5 ft.)

  * **Muito Perto:** 4,5 m (15 ft.)

  * **Perto:** 9 m (30 ft.)

  * **Longe:** 18 m (60 ft.)

* **Hover Inteligente:** Passe o mouse sobre qualquer token para ver exatamente a que distância ele está do seu personagem. Sem necessidade de régua!

* **Alternância Fácil:** Ative ou desative os anéis rapidamente usando um botão no HUD do Token ou um atalho de teclado.

* **Detecção de Borda Inteligente:** Preciso para tokens de todos os tamanhos! O sistema mede a distância de borda a borda, em vez de centro a centro. Também verifica a cobertura visual: um token só é considerado "no alcance" se uma porcentagem específica do seu corpo (configurável) estiver fisicamente dentro do anel, garantindo que o que você vê corresponde às regras.

**Defina quanto do token deve estar dentro do círculo para ser considerado no alcance.**
<p align="center"><img width="700" src="threshold.webp"></p>

**O sistema leva em conta o tamanho do token ao calcular o alcance.**
<p align="center"><img width="700" src="sizes.webp"></p>

* **Medição em Massa:** Selecione múltiplos tokens e use a macro `DHDistances.MassMeasurement();` para gerar anéis de distância a partir do centro do grupo.
<p align="center"><img width="700" src="massmeasurement.webp"></p>

* **Destaque de Alvos:** Alvos válidos dentro dos anéis de alcance brilham com a cor do anel correspondente.
<p align="center"><img width="700" src="highlighting.webp"></p>

* **Pré-visualização Fantasma:** Os anéis de alcance acompanham a pré-visualização do token ao arrastar para testar posições.

### 📡 Transmissão — Compartilhe os Anéis com Todos

O MJ pode mostrar os anéis de distância para **todos os jogadores conectados** de uma vez. Ao transmitir, os anéis aparecem na tela de cada jogador e desaparecem automaticamente após uma duração configurável (padrão: 7 segundos).

Perfeito para destacar o alcance de uma ameaça durante o combate, mantendo toda a mesa na mesma página — sem precisar descrever distâncias verbalmente.

**Três formas de transmitir:**

* **Teclado:** Selecione um token e pressione **`Shift+R`**
* **Macro:** `DHDistances.Toggle({ remote: true });`
* **Modo Hover de Transmissão:** Ative nas configurações e cada token que você passar o mouse será automaticamente transmitido aos jogadores (veja Modo de Operação abaixo)

> **Nota:** Apenas o MJ pode transmitir. Jogadores que pressionam `Shift+R` não têm efeito.

### 🎮 Modo de Operação — Como os Anéis São Ativados

Você pode alterar *como* os anéis aparecem selecionando um **Modo de Operação** nas Configurações do Módulo:

| Modo | O que faz |
|---|---|
| **Manual** *(padrão)* | Os anéis só aparecem quando você pressiona `R` ou clica no botão do HUD |
| **Modo Hover (MJ)** | Os anéis aparecem automaticamente enquanto o MJ passa o mouse sobre tokens — apenas localmente |
| **Modo Hover (Transmissão)** | Igual ao anterior, mas cada hover transmite os anéis para todos os jogadores |

Você também pode **substituir temporariamente** o modo ativo usando teclas de atalho — útil quando está no modo Manual mas quer uma transmissão rápida sem alterar as configurações:

* **Segure `Shift+H`** — ativa o Modo Hover (MJ) enquanto a tecla estiver pressionada
* **Segure `Shift+B`** — ativa o Modo Hover (Transmissão) enquanto a tecla estiver pressionada

Solte a tecla e o modo volta ao normal.

### 🎨 Personalização

* **Temas Bonitos:** Escolha entre paletas de cores pré-definidas como "Semáforo", "Synthwave" ou "Fogo Verdadeiro".

* **Estilos Visuais:** Configure os anéis com linhas sólidas, pontilhadas ou tracejadas, e ajuste a espessura.

* **Efeitos Imersivos:** Ative preenchimentos gradientes animados que pulsam suavemente, ou mantenha simples com cores estáticas.

## ⚙️ Como Usar

### Alternando os Anéis

<p align="center"><img width="600" src="preview.webp"></p>

Você tem várias formas fáceis de mostrar ou ocultar os anéis de alcance ao redor de um token:

1. **HUD do Token:** Clique com o botão direito em um token para abrir o HUD, depois clique no ícone de **Círculo** (<i class="fas fa-circle-dot"></i>).

2. **Atalhos de Teclado:**

| Atalho | Ação |
|---|---|
| `R` | Alternar anéis (local, apenas para você) |
| `Shift+R` | Transmitir anéis para todos os jogadores (apenas MJ) |
| `M` | Medição em Massa a partir dos tokens selecionados |
| `Shift+Delete` | Limpar todos os anéis ativos de uma vez |
| `Segure Shift+H` | Ativar temporariamente o Modo Hover (MJ) |
| `Segure Shift+B` | Ativar temporariamente o Modo Hover (Transmissão) |

> Todos os atalhos podem ser reatribuídos em **Configurações do Foundry → Configurar Controles**.

3. Você também pode usar macros:

```js
DHDistances.Toggle();              // Alternar anéis para o token selecionado/sob o cursor
DHDistances.Toggle({ remote: true }); // Transmitir anéis para todos os jogadores (apenas MJ)
DHDistances.MassMeasurement();     // Medição em Massa a partir dos tokens selecionados
DHDistances.ClearAll();            // Remover todos os anéis ativos (respeita a configuração Modo Limpar Tudo)
```

```js
DHDistances.Toggle({mode: '2d'}); // Calcula distância ignorando elevação.
```

```js
DHDistances.Toggle({mode: '3d'}); // Calcula distância levando em conta a elevação.
```

```js
DHDistances.Toggle({mode: 'both'}); // Mostra as distâncias 3D e 2D ao mesmo tempo.
```

```js
// Apenas MJ: substituição explícita de escopo (tem precedência sobre a configuração Modo Limpar Tudo)
DHDistances.ClearAll({ scope: 'all' });  // Remover anéis para todos os jogadores conectados
DHDistances.ClearAll({ scope: 'self' }); // Remover anéis apenas para o MJ
```

### Configuração

Acesse a aba **Configurações do Módulo** no Foundry VTT para personalizar a aparência:

<p align="center"><img width="600" src="settings.webp"></p>

## 🚀 Instalação

Instale pelo navegador de Módulos do Foundry VTT ou use este link de manifesto:

* *https://raw.githubusercontent.com/brunocalado/daggerheart-distances/main/module.json*

## 🌍 Traduções

Quer traduzir este módulo para o seu idioma? Veja como:

1. Baixe o arquivo de tradução em inglês: [languages/en.json](https://github.com/brunocalado/daggerheart-distances/blob/main/languages/en.json)
2. Traduza os valores (mantenha as chaves sem alteração)
3. Envie sua tradução em [GitHub Issues](https://github.com/brunocalado/daggerheart-distances/issues) — anexe o arquivo traduzido e mencione o idioma de destino

## 📜 Changelog

Você pode ler o histórico completo de alterações no [CHANGELOG](../CHANGELOG.md).

## ⚖️ Créditos e Licença

* **Licença do Código:** [LICENSE](../LICENSE).

* Este módulo é um fork de [este projeto](https://github.com/fsergler/foundry_combat_distances)

**Aviso:** Este módulo é uma criação independente e não tem afiliação com a Darrington Press.

# 🧰 Meus Módulos para Daggerheart

| Módulo | Descrição |
| :--- | :--- |
| 💀 [**Adversary Manager**](https://github.com/brunocalado/daggerheart-advmanager) | Escale adversários instantaneamente e monte encontros equilibrados no Foundry VTT. |
| 🌟 [**Best Modules**](https://github.com/brunocalado/dh-best-modules) | Uma coleção curada de módulos essenciais para aprimorar a experiência no Daggerheart. |
| 🐉 [**Colossus**](https://github.com/brunocalado/dh-colossus) | Gerencie encontros com chefões massivos de múltiplas partes com HP independente por parte e um único pool de stress compartilhado. |
| 💥 [**Critical**](https://github.com/brunocalado/daggerheart-critical) | Acerto Crítico Animado. |
| 💠 [**Custom Stat Tracker**](https://github.com/brunocalado/dh-new-stat-tracker) | Adicione rastreadores personalizados aos atores. |
| ☠️ [**Death Moves**](https://github.com/brunocalado/daggerheart-death-moves) | Aprimora o momento do Movimento de Morte com uma interface dramática e automação completa. |
| 📏 [**Distances**](https://github.com/brunocalado/daggerheart-distances) | Visualiza alcances de combate com anéis personalizáveis e cálculos por hover. |
| 📦 [**Extra Content**](https://github.com/brunocalado/daggerheart-extra-content) | Homebrew para Daggerheart. |
| 🤖 [**Resource Macros**](https://github.com/brunocalado/daggerheart-fear-macros) | Executa macros automaticamente quando os recursos de Medo ou Esperança são alterados. |
| 😱 [**Fear Tracker**](https://github.com/brunocalado/daggerheart-fear-tracker) | Adiciona uma barra deslizante animada com tokens de medo configuráveis à interface. |
| 🧟 [**Horde**](https://github.com/brunocalado/dh-horde) | Divida tokens de horda em dezenas de tokens individuais e gerencie o movimento e os atributos automaticamente. |
| 🎁 [**Mystery Box**](https://github.com/brunocalado/dh-mystery-box) | Introduz mecânicas de caixa misteriosa para saque aleatório e surpresas. |
| ⚡ [**Quick Actions**](https://github.com/brunocalado/daggerheart-quickactions) | Acesso rápido a mecânicas comuns como Dano por Queda, Tempo Livre, etc. |
| 📜 [**Quick Rules**](https://github.com/brunocalado/daggerheart-quickrules) | Guia de referência rápido e acessível para as regras principais. |
| 🎲 [**Stats**](https://github.com/brunocalado/daggerheart-stats) | Rastreia rolagens de dados do MJ e dos Jogadores. |
| 🧠 [**Stats Toolbox**](https://github.com/brunocalado/dh-statblock-importer) | Importe usando um bloco de estatísticas. |
| 🛒 [**Store**](https://github.com/brunocalado/daggerheart-store) | Uma loja dinâmica, interativa e totalmente configurável para o Foundry VTT. |
| 🔍 [**Unidentified**](https://github.com/brunocalado/dh-unidentified) | Oculta nomes e descrições de itens até que sejam identificados pelos jogadores. |

# 🗺️ Aventuras

| Aventura | Descrição |
| :--- | :--- |
| ✨ [**I Wish**](https://github.com/brunocalado/i-wish-daggerheart-adventure) | Um rico mercador está amaldiçoado; uma expedição final pode ser a única esperança. |
| 💣 [**Suicide Squad**](https://github.com/brunocalado/suicide-squad-daggerheart-adventure) | Criminosos forçados a servir um mestre implacável em uma terra à beira da guerra. |
