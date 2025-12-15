# Documentação da Plataforma Isket

Esta documentação descreve as principais funcionalidades e componentes da plataforma Isket, organizadas por módulos.

---

## 📋 Índice

1. [Rotas Públicas](#rotas-públicas)
2. [Módulo de Search (Pesquisa)](#módulo-de-search-pesquisa)
3. [Módulo de Sourcing (Captação)](#módulo-de-sourcing-captação)
4. [Módulo de Management (Gerenciamento)](#módulo-de-management-gerenciamento)

---

## 🔓 Rotas Públicas

As rotas públicas são acessíveis sem autenticação e incluem todo o fluxo de autenticação e recuperação de conta.

### Estrutura de Arquivos

```
src/scripts/pages/public/
├── Login.tsx
├── SignUp.tsx
├── ForgotPassword.tsx
├── ResetPassword.tsx
├── EmailVerification.tsx
├── CompleteSignUp.tsx
├── CompleteProfile.tsx
└── Error404.tsx
```

### Rotas Configuradas

| Rota                     | Componente          | Descrição               |
| ------------------------ | ------------------- | ----------------------- |
| `/login`                 | `Login`             | Página de login         |
| `/cadastro`              | `SignUp`            | Início do cadastro      |
| `/esqueceu-senha`        | `ForgotPassword`    | Recuperação de senha    |
| `/reset-password/:token` | `ResetPassword`     | Redefinição de senha    |
| `/email-verification`    | `EmailVerification` | Verificação de email    |
| `/complete-signup`       | `CompleteSignUp`    | Finalização do cadastro |
| `/complete-profile`      | `CompleteProfile`   | Completar perfil        |
| `*`                      | `Error404`          | Página de erro 404      |

### 1. Login (`/login`)

**Arquivo:** `src/scripts/pages/public/Login.tsx`

**Funcionalidades:**

- Autenticação com email e senha
- Login com Google (via `GoogleButton`)
- Validação de campos obrigatórios
- Tratamento de erros de autenticação
- Verificação de assinatura expirada
- Redirecionamento após login bem-sucedido
- Link para recuperação de senha
- Link para cadastro

**Fluxo:**

1. Usuário preenche email e senha
2. Sistema valida campos
3. Chama API `postAuthLogin`
4. Busca dados do usuário com `getAuthMe`
5. Verifica status da assinatura
6. Se assinatura expirada, exibe modal de bloqueio
7. Se sucesso, faz login e redireciona

**Componentes Utilizados:**

- `CustomTextField` - Campo de texto customizado
- `GoogleButton` - Botão de login com Google
- `SubscriptionBlockedModal` - Modal de assinatura bloqueada

**Serviços:**

- `postAuthLogin` - Autenticação
- `getAuthMe` - Buscar dados do usuário

---

### 2. SignUp (`/cadastro`)

**Arquivo:** `src/scripts/pages/public/SignUp.tsx`

**Funcionalidades:**

- Coleta de email para cadastro
- Envio de código de verificação
- Login com Google
- Validação de email
- Redirecionamento para verificação

**Fluxo:**

1. Usuário informa email
2. Sistema envia código via `postAuthSendVerificationCode`
3. Redireciona para `/email-verification` com email no state

**Serviços:**

- `postAuthSendVerificationCode` - Enviar código de verificação

---

### 3. Email Verification (`/email-verification`)

**Arquivo:** `src/scripts/pages/public/EmailVerification.tsx`

**Funcionalidades:**

- Entrada de código de 4 dígitos
- Navegação automática entre campos
- Suporte a colar código completo
- Validação do código
- Reenvio de código (se necessário)

**Fluxo:**

1. Usuário recebe código por email
2. Digita código de 4 dígitos
3. Sistema valida com `postAuthVerifyCode`
4. Se válido, redireciona para `/complete-signup`

**Serviços:**

- `postAuthVerifyCode` - Verificar código

---

### 4. Complete SignUp (`/complete-signup`)

**Arquivo:** `src/scripts/pages/public/CompleteSignUp.tsx`

**Funcionalidades:**

- Coleta de dados completos do usuário
- Validação de senha (mínimo 8 caracteres, maiúscula, minúscula, número, caractere especial)
- Seleção de cidade padrão
- Confirmação de senha
- Login automático após cadastro

**Campos:**

- Email (pré-preenchido e desabilitado se veio da verificação)
- Nome completo
- Senha
- Confirmar senha
- Cidade (via `CitySelect`)

**Fluxo:**

1. Usuário preenche dados
2. Sistema valida senha
3. Chama `postAuthRegister`
4. Faz login automático com `postAuthLogin`
5. Busca dados do usuário
6. Redireciona para dashboard

**Serviços:**

- `postAuthRegister` - Registrar usuário
- `postAuthLogin` - Login automático
- `getAuthMe` - Buscar dados do usuário

**Componentes:**

- `CitySelect` - Seletor de cidade
- `CustomTextField` - Campos de texto

---

### 5. Forgot Password (`/esqueceu-senha`)

**Arquivo:** `src/scripts/pages/public/ForgotPassword.tsx`

**Funcionalidades:**

- Solicitação de recuperação de senha
- Envio de email com link de recuperação
- Feedback visual de sucesso
- Tratamento de erros (404, 503)

**Fluxo:**

1. Usuário informa email
2. Sistema envia email via `postAuthRecoveryPassword`
3. Exibe mensagem de sucesso
4. Oferece botão para voltar ao login

**Serviços:**

- `postAuthRecoveryPassword` - Solicitar recuperação

---

### 6. Reset Password (`/reset-password/:token`)

**Arquivo:** `src/scripts/pages/public/ResetPassword.tsx`

**Funcionalidades:**

- Redefinição de senha com token
- Validação de senha forte
- Confirmação de senha
- Verificação de token válido
- Feedback de sucesso

**Validações:**

- Token presente na URL
- Senhas coincidem
- Senha atende critérios de segurança
- Token válido e não expirado

**Fluxo:**

1. Usuário acessa link com token
2. Preenche nova senha e confirmação
3. Sistema valida
4. Chama `postAuthVerifyChangePassword`
5. Redireciona para login após 2 segundos

**Serviços:**

- `postAuthVerifyChangePassword` - Redefinir senha

**Helpers:**

- `validatePassword` - Validador de senha

---

### 7. Complete Profile (`/complete-profile`)

**Arquivo:** `src/scripts/pages/public/CompleteProfile.tsx`

**Funcionalidades:**

- Completar perfil após cadastro
- Coleta de nome e cidade
- Validação de campos obrigatórios

**Nota:** Este componente parece estar em desenvolvimento ou não está totalmente integrado com a API.

---

### 8. Error 404 (`*`)

**Arquivo:** `src/scripts/pages/public/Error404.tsx`

**Funcionalidades:**

- Página de erro para rotas não encontradas
- Link para voltar ao dashboard

---

## 🔍 Módulo de Search (Pesquisa)

O módulo de Search permite aos usuários pesquisar e filtrar propriedades imobiliárias com recursos avançados de busca, visualização em mapa e detalhamento de imóveis.

### Estrutura de Arquivos

```
src/scripts/pages/private/search/
└── search.component.tsx

src/scripts/modules/search/
├── filter/
│   ├── filter-bar.tsx
│   └── filter-modal.tsx
├── map/
│   ├── map.tsx
│   └── map-utils.ts
├── properties-card.tsx
└── property-details/
    ├── property-details.tsx
    ├── property-gallery.tsx
    ├── property-information.tsx
    ├── property-localization.tsx
    └── fullscreen-gallery.tsx
```

### Rota

- **Rota:** `/pesquisar-anuncios`
- **Rota com ID:** `/pesquisar-anuncios/:propertyId`
- **Componente Principal:** `SearchComponent`

### Funcionalidades Principais

#### 1. Busca e Filtros

**Componente:** `FilterBar` e `FilterModal`

**Filtros Disponíveis:**

**Negócio:**

- Venda
- Aluguel

**Finalidade:**

- Residencial
- Comercial
- Industrial
- Agricultura

**Tipos de Imóveis:**

_Apartamentos:_

- Padrão, Flat, Loft, Studio, Duplex, Triplex, Cobertura

_Comerciais:_

- Sala, Casa, Ponto, Galpão, Loja, Prédio, Clínica, Coworking, Sobreloja

_Casas e Sítios:_

- Casa, Sobrado, Sítio, Chalé, Chácara, Edícula

_Terrenos:_

- Terreno, Fazenda

_Outros:_

- Garagem, Quarto, Resort, República, Box, Tombado, Granja, Haras, Outros

**Filtros Numéricos:**

- Quartos (mínimo)
- Banheiros (mínimo)
- Suítes (mínimo)
- Vagas de garagem (mínimo)
- Área (mínima e máxima)
- Preço (mínimo e máximo)

**Filtros Adicionais:**

- Tipo de Anunciante (Proprietário Direto, Imobiliária, Portal)
- Lançamento
- Palavras-chave
- Cidades
- Bairros
- Busca por endereço (com coordenadas)
- Desenho de áreas no mapa (polígono ou círculo)

#### 2. Visualização em Mapa

**Componente:** `MapComponent`

**Funcionalidades:**

- Visualização de propriedades no mapa do Google Maps
- Marcadores individuais e clusters
- Desenho de polígonos e círculos para busca por área
- Busca por endereço com geocodificação
- Visualização de limites de bairros
- InfoWindow com informações resumidas
- Integração com filtros

**Recursos:**

- `DrawingManager` para desenhar áreas
- Clusters de marcadores para melhor performance
- Busca de propriedades dentro de áreas desenhadas
- Zoom automático para áreas selecionadas

#### 3. Listagem de Propriedades

**Componentes:** `PropertiesCard`

**Modos de Visualização:**

- **Cards:** Visualização em grid de cards
- **Lista:** Visualização em lista vertical
- **Mapa:** Visualização apenas no mapa (modal no mobile)

**Informações Exibidas:**

- Imagens do imóvel
- Título
- Preço e preço por m²
- Endereço completo
- Tipo de propriedade
- Área, quartos, banheiros, garagem
- Indicador de favorito

**Paginação:**

- 18 itens por página
- Navegação entre páginas
- Contador de resultados

#### 4. Detalhes da Propriedade

**Componente:** `PropertyDetails`

**Seções:**

1. **Galeria de Imagens** (`PropertyGallery`)

   - Carrossel de imagens
   - Visualização em tela cheia
   - Navegação por setas ou gestos

2. **Informações** (`PropertyInformation`)

   - Preço e preço por m²
   - Tipo de propriedade
   - Área total e útil
   - Quartos, banheiros, suítes, garagem
   - Descrição completa
   - Características e comodidades

3. **Localização** (`PropertyLocalization`)
   - Endereço completo
   - Mapa com localização
   - Informações do bairro
   - Pontos de interesse próximos

**Ações Disponíveis:**

- Favoritar/Desfavoritar
- Compartilhar
- Contatar anunciante
- Ver no mapa

#### 5. Ordenação

**Opções de Ordenação:**

- Relevância (padrão)
- Preço por m² (crescente/decrescente)
- Preço (crescente/decrescente)
- Área (crescente/decrescente)

### Fluxo de Uso

1. **Acesso à Página:**

   - Usuário acessa `/pesquisar-anuncios`
   - Sistema carrega filtros padrão

2. **Aplicação de Filtros:**

   - Usuário abre modal de filtros
   - Seleciona critérios desejados
   - Aplica filtros
   - Sistema busca propriedades via API

3. **Visualização:**

   - Propriedades são exibidas em cards ou lista
   - Usuário pode alternar entre modos
   - Pode visualizar no mapa

4. **Detalhamento:**

   - Usuário clica em uma propriedade
   - Abre modal/drawer com detalhes completos
   - Pode navegar pelas imagens
   - Pode ver localização no mapa

5. **Busca no Mapa:**
   - Usuário pode desenhar área no mapa
   - Sistema busca propriedades na área
   - Pode combinar com outros filtros

### Serviços Utilizados

- `postPropertyAdSearch` - Busca de propriedades
- `postPropertyAdSearchMap` - Busca no mapa
- `getNeighborhoods` - Buscar bairros
- `getCityByCode` - Buscar cidade por código
- `postCitiesFindMany` - Buscar múltiplas cidades
- `postNeighborhoodsFindManyByCities` - Buscar bairros por cidades

### Helpers

- `mapFiltersToApi` - Converter filtros para formato da API
- `mapApiToPropertyDataArray` - Converter resposta da API para dados de propriedades
- `mapFiltersToSearchMap` - Converter filtros para busca no mapa
- `convertOverlayToGeoJSONPolygon` - Converter polígono do mapa para GeoJSON
- `convertOverlayToGeoJSONCircle` - Converter círculo do mapa para GeoJSON

---

## 📦 Módulo de Sourcing (Captação)

O módulo de Sourcing gerencia o processo de captação de imóveis e contatos, organizando-os em um sistema Kanban com diferentes estágios do processo de aquisição.

### Estrutura de Arquivos

```
src/scripts/pages/private/sourcing/
└── sourcing.component.tsx

src/scripts/modules/sourcing/
├── buttons-bar.tsx
├── kanban.component.tsx
├── kanban-cards.component.tsx
├── list-view.component.tsx
├── sourcing-type-modal.tsx
├── property-sourcing-modal.tsx
├── contact-sourcing-modal.tsx
├── property-sourcing-details.component.tsx
├── contact-sourcing-details.tsx
├── resident-search-modal.tsx
├── search-resident-result-modal.tsx
├── reveal-contact-modal.tsx
├── create-contact-modal.tsx
└── create-property-capture-modal.tsx
```

### Rota

- **Rota:** `/captacao`
- **Componente Principal:** `SourcingComponent`

### Funcionalidades Principais

#### 1. Visualização Kanban

**Componente:** `Kanban`

**Colunas Padrão:**

1. **Captação por Imóvel** (property-sourcing)

   - Imóveis em processo de captação
   - Cor: Verde claro (#C8E6C9)
   - Ícone: Home

2. **Captação por Contato** (contact-sourcing)

   - Contatos em processo de captação
   - Cor: Azul claro (#BBDEFB)
   - Ícone: Person

3. **Prospecção** (prospecting)

   - Leads em fase de prospecção
   - Cor: Rosa claro (#F8BBD0)
   - Ícone: TrendingUp

4. **Visita** (visit)
   - Imóveis agendados para visita
   - Cor: Laranja claro (#FFE0B2)
   - Ícone: LocationOn

**Funcionalidades:**

- Arrastar e soltar cards entre colunas (drag & drop)
- Adicionar novas colunas customizadas
- Busca/filtro de cards
- Visualização responsiva

#### 2. Visualização em Lista

**Componente:** `ListView`

**Funcionalidades:**

- Lista vertical de todas as captações
- Filtros e busca
- Ações rápidas (editar, excluir)
- Ordenação

#### 3. Tipos de Captação

**Modal:** `SourcingTypeModal`

**Opções:**

- **Captação por Imóvel:** Captar um imóvel específico
- **Captação por Contato:** Captar através de um contato/proprietário

#### 4. Captação por Imóvel

**Modal:** `PropertySourcingModal`

**Campos:**

- Endereço
- Número
- Complemento
- Tipo de propriedade
- Título da captação

**Fluxo:**

1. Usuário seleciona "Captação por Imóvel"
2. Preenche dados do imóvel
3. Sistema cria processo de aquisição
4. Card é adicionado à coluna apropriada

**Detalhes:** `PropertySourcingDetails`

**Informações Exibidas:**

- Dados completos do imóvel
- Status da captação (IN_ACQUISITION, DECLINED, ACQUIRED)
- Histórico de interações
- Ações disponíveis

**Ações:**

- Editar título
- Rejeitar captação
- Confirmar captação
- Adicionar observações

#### 5. Captação por Contato

**Modal:** `ContactSourcingModal`

**Campos:**

- Nome
- CPF
- Email
- Telefone
- Título da captação

**Fluxo:**

1. Usuário seleciona "Captação por Contato"
2. Preenche dados do contato
3. Sistema cria processo de aquisição
4. Card é adicionado à coluna apropriada

**Detalhes:** `ContactSourcingDetails`

**Informações Exibidas:**

- Dados completos do contato
- Imóveis associados
- Histórico de interações
- Status da captação

**Ações:**

- Editar título
- Rejeitar captação
- Confirmar captação
- Adicionar observações

#### 6. Pesquisa de Moradores

**Modal:** `ResidentSearchModal`

**Funcionalidades:**

- Busca de moradores por endereço
- Filtros avançados
- Integração com base de dados de moradores

**Resultados:** `SearchResidentResultModal`

**Informações:**

- Lista de moradores encontrados
- Dados parciais (nome, CPF parcial)
- Opção de revelar dados completos

**Revelação:** `RevealContactModal`

**Funcionalidades:**

- Revelar dados completos do morador
- Criar captação automaticamente a partir dos dados
- Integração com captação por contato

#### 7. Barra de Ações

**Componente:** `ButtonsBar`

**Ações Disponíveis:**

- **Adicionar Captação:** Abre modal de seleção de tipo
- **Pesquisar Moradores:** Abre modal de busca
- **Busca:** Campo de busca para filtrar cards
- **Alternar Visualização:** Grid (Kanban) ou Lista

### Fluxo de Uso

1. **Criar Captação:**

   - Usuário clica em "Adicionar Captação"
   - Seleciona tipo (Imóvel ou Contato)
   - Preenche formulário
   - Sistema cria processo e adiciona card

2. **Gerenciar Captação:**

   - Usuário clica em um card
   - Visualiza detalhes completos
   - Pode editar, rejeitar ou confirmar

3. **Mover entre Estágios:**

   - Usuário arrasta card entre colunas
   - Sistema atualiza status automaticamente

4. **Buscar Moradores:**
   - Usuário pesquisa por endereço
   - Visualiza resultados
   - Revela dados e cria captação

### Serviços Utilizados

- `getPropertyListingAcquisitionById` - Buscar detalhes de captação
- Serviços de criação/atualização de captações
- Serviços de busca de moradores

### Estados da Captação

- `IN_ACQUISITION` - Em processo de captação
- `DECLINED` - Recusada
- `ACQUIRED` - Captada com sucesso

---

## ⚙️ Módulo de Management (Gerenciamento)

O módulo de Management centraliza todas as configurações e gerenciamento da conta, perfil, segurança, assinatura e colaboradores.

### Estrutura de Arquivos

```
src/scripts/pages/private/management/
├── management.component.tsx
├── profile/
│   └── profile.component.tsx
├── security/
│   └── security.component.tsx
├── subscription/
│   └── subscription.component.tsx
├── upgrade/
│   └── upgrade.component.tsx
├── company/
│   └── company.component.tsx
└── collaborators/
    ├── collaborators.component.tsx
    └── user-details.component.tsx
```

### Rota

- **Rota:** `/configuracoes`
- **Parâmetros de URL:** `?section=profile|security|subscription|upgrade|company|collaborators`
- **Componente Principal:** `ManagementComponent`

### Estrutura de Navegação

O módulo possui uma sidebar com seções organizadas:

**Seção CONTA:**

- Perfil
- Segurança

**Seção EMPRESA:** (Apenas para planos BUSINESS)

- Detalhes da Empresa
- Colaboradores

**Seção FATURAMENTO:**

- Meu Plano
- Upgrade

### Funcionalidades Principais

#### 1. Perfil (`profile`)

**Componente:** `ProfileSection`

**Funcionalidades:**

- Visualização e edição de dados pessoais
- Upload de foto de perfil
- Edição de informações de contato

**Campos Editáveis:**

- Nome completo
- Email
- Telefone
- Endereço
- CPF (visualização)

**Recursos:**

- Preview de foto antes de salvar
- Validação de formatos
- Feedback visual de sucesso/erro
- Cache com SWR para dados atualizados

**Serviços:**

- `useGetAuthMe` - Buscar dados do perfil
- `patchProfile` - Atualizar perfil
- `uploadProfilePhoto` - Upload de foto

#### 2. Segurança (`security`)

**Componente:** `SecuritySection`

**Funcionalidades:**

- Alteração de senha
- Gerenciamento de métodos de autenticação
- Configurações de privacidade
- Histórico de login
- Autenticação de dois fatores (se disponível)

**Recursos:**

- Validação de senha forte
- Confirmação de senha atual
- Feedback de segurança

#### 3. Assinatura (`subscription`)

**Componente:** `SubscriptionSection`

**Funcionalidades:**

- Visualização do plano atual
- Detalhes da assinatura
- Histórico de pagamentos
- Métodos de pagamento
- Renovação automática
- Cancelamento de assinatura

**Informações Exibidas:**

- Tipo de plano (PERSONAL, BUSINESS)
- Data de vencimento
- Status da assinatura
- Valor e periodicidade
- Faturas anteriores

**Serviços:**

- `useGetPurchases` - Buscar assinaturas

#### 4. Upgrade (`upgrade`)

**Componente:** `UpgradeSection`

**Funcionalidades:**

- Visualização de planos disponíveis
- Comparação de recursos
- Processo de upgrade
- Integração com pagamento

**Planos:**

- **PERSONAL:** Plano individual
- **BUSINESS:** Plano empresarial (imobiliária)

**Recursos do Plano BUSINESS:**

- Gerenciamento de colaboradores
- Detalhes da empresa
- Recursos avançados

#### 5. Detalhes da Empresa (`company`)

**Componente:** `CompanySection`

**Disponibilidade:** Apenas para planos BUSINESS

**Funcionalidades:**

- Edição de dados da empresa
- CNPJ, razão social, nome fantasia
- Endereço da empresa
- Dados de contato
- Logo da empresa

**Campos:**

- CNPJ
- Razão Social
- Nome Fantasia
- Endereço completo
- Telefone
- Email corporativo

#### 6. Colaboradores (`collaborators`)

**Componente:** `CollaboratorsSection`

**Disponibilidade:** Apenas para planos BUSINESS

**Funcionalidades:**

- Listagem de colaboradores
- Adicionar novos colaboradores
- Editar permissões
- Ativar/Desativar colaboradores
- Visualizar detalhes

**Roles Disponíveis:**

- **OWNER:** Proprietário da conta
- **ADMIN:** Administrador
- **MEMBER:** Membro comum

**Fluxo de Convite:**

1. Administrador adiciona email do colaborador
2. Sistema envia convite por email
3. Colaborador aceita convite
4. Colaborador é adicionado à equipe

**Componente de Detalhes:** `UserDetailsComponent`

**Informações Exibidas:**

- Dados completos do colaborador
- Foto de perfil
- Email e telefone
- Role/permissões
- Status (ativo/inativo)
- Data de criação
- Histórico de atividades

**Ações:**

- Editar role
- Ativar/Desativar
- Remover colaborador
- Reenviar convite

**Serviços:**

- `useGetUsers` - Listar colaboradores
- `postUsersInvite` - Enviar convite
- `patchUser` - Atualizar colaborador

### Fluxo de Uso

1. **Acesso às Configurações:**

   - Usuário acessa `/configuracoes`
   - Sidebar exibe seções disponíveis
   - Seções de empresa só aparecem para planos BUSINESS

2. **Navegação:**

   - Usuário clica em uma seção na sidebar
   - Conteúdo é atualizado
   - URL pode incluir parâmetro `?section=...`

3. **Edição de Dados:**

   - Usuário edita campos
   - Sistema valida dados
   - Salva via API
   - Atualiza cache (SWR)
   - Exibe feedback

4. **Gerenciamento de Colaboradores:**
   - Administrador acessa seção Colaboradores
   - Visualiza lista de colaboradores
   - Pode adicionar, editar ou remover
   - Convites são enviados por email

### Responsividade

- **Desktop:** Sidebar fixa à esquerda, conteúdo à direita
- **Mobile:** Drawer lateral que abre/fecha, conteúdo em tela cheia

### Serviços Utilizados

- `useGetAuthMe` - Dados do usuário
- `useGetPurchases` - Assinaturas
- `useGetUsers` - Colaboradores
- `patchProfile` - Atualizar perfil
- `patchUser` - Atualizar colaborador
- `postUsersInvite` - Convidar colaborador
- `uploadProfilePhoto` - Upload de foto

### Cache e Atualização

O módulo utiliza SWR (stale-while-revalidate) para:

- Cache de dados
- Atualização automática
- Sincronização entre componentes
- Invalidação de cache após mutações

---

## 🔐 Autenticação e Autorização

### Access Manager

**Componente:** `AccessManager`

**Funcionalidades:**

- Proteção de rotas privadas
- Verificação de autenticação
- Redirecionamento para login se não autenticado
- Verificação de assinatura ativa

**Uso:**

```tsx
<AccessManager component={ComponentePrivado} requireAuth={true} />
```

### Context de Autenticação

**Arquivo:** `src/scripts/modules/access-manager/auth.context.tsx`

**Funcionalidades:**

- Gerenciamento de estado de autenticação
- Armazenamento de tokens
- Dados do usuário
- Métodos de login/logout

**Hook:** `useAuth()`

**Store:**

- `token` - Access token
- `refreshToken` - Refresh token
- `user` - Dados do usuário

---

## 📱 Responsividade

Todos os módulos são responsivos e adaptam-se a diferentes tamanhos de tela:

- **Mobile:** Layout vertical, modais em tela cheia, navegação simplificada
- **Tablet:** Layout intermediário, sidebar colapsável
- **Desktop:** Layout completo, sidebar fixa, múltiplas colunas

---

## 🎨 Design System

A plataforma utiliza Material-UI (MUI) com tema customizado:

- **Cores:** Paleta de marca (`theme.palette.brand`)
- **Componentes:** Componentes customizados reutilizáveis
- **Tipografia:** Hierarquia clara e consistente
- **Espaçamento:** Sistema de grid e spacing do MUI

---

## 📝 Notas Finais

- Todos os módulos seguem padrões consistentes de código
- Utilizam TypeScript para type safety
- Integração com APIs RESTful
- Tratamento de erros robusto
- Feedback visual para ações do usuário
- Performance otimizada com debounce, paginação e cache

---

**Última atualização:** Dezembro 2024
