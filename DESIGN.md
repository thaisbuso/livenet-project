# 🎨 Documentação de Design - Nautimar Live MVP

## 📋 Visão Geral

O projeto foi redesenhado com **Bootstrap 5** e uma paleta de cores **cinza escuro + amarelo** para criar uma interface moderna e profissional, otimizada para livestreaming com rastreamento de GPS.

## 🎯 Cores Customizadas

### Paleta Principal
```css
--dark-gray: #1a1a1a              /* Fundo principal */
--dark-gray-secondary: #2d2d2d    /* Cards e elementos */
--dark-gray-tertiary: #3a3a3a     /* Estados hover */
--yellow-primary: #ffc107         /* Destaque principal */
--yellow-hover: #ffb300           /* Hover dos botões */
--text-light: #f5f7fa             /* Texto principal */
--text-muted: #b7c4d3             /* Texto secundário */
--border-color: rgba(255, 193, 7, 0.15)  /* Bordas com toque amarelo */
```

## 🏗️ Estrutura de Componentes

### Navbar
- **Cor de fundo:** Cinza escuro secundário com borda amarela
- **Logo:** Amarelo com hover smooth
- **Links:** Texto claro com transição para amarelo ao passar
- **Status badges:** Mostram estado da transmissão

### Cards
- **Fundo:** Cinza escuro secundário
- **Borda:** Amarela com transparência
- **Efeito hover:** Borda mais visível e sombra com cor amarela
- **Transição:** 0.3s ease para suavidade

### Botões
- **Primário:** Fundo amarelo, texto escuro, hover com transform
- **Secundário:** Borda cinzenta com hover preenchido
- **Perigo:** Vermelho com transição suave
- **Todos:** Texto uppercase com letter-spacing

### Inputs
- **Fundo:** Cinza escuro terciário
- **Focus:** Borda amarela + sombra com cor amarela
- **Placeholder:** Texto mutilado

### Badges & Status
- **Success (verde):** Transmissão ativa
- **Warning (amarelo):** Estado aguardando
- **Danger (vermelho):** Erros
- **Info (azul):** Informações

## 📱 Páginas Atualizadas

### 1. HomePage (/)
- **Layout:** Container fluid com hero section
- **Grid responsivo:** 2 colunas em desktop, 1 em mobile
- **Destaque:** Cards com borda amarela para funcionalidades
- **CTA:** Botões primários com hover notável

### 2. AdminClientPage (/admin)
- **Navbar:** Com logo e badge de status
- **Layout:** 2 colunas (formulário + status)
- **Formulário:**
  - Token (password input)
  - Intervalo de envio
  - Coordenadas (Lat/Lng em 2 colunas)
  - Velocidade e Heading
  - 3 botões principais
- **Status:** Tabela de dados atuais + alertas contextuais

### 3. LivePage (/live)
- **Navbar:** Simples com logo
- **Status banner:** Mostra título da sessão com badge "AO VIVO"
- **Layout:** 2 colunas responsivas
  - **Esquerda:** Transmissão ao vivo (iframe)
  - **Direita:** Mapa com dados de GPS
- **Mapa:**
  - Coordenadas em destaque (cinza + amarelo)
  - Marcador amarelo/laranja na posição atual
  - Linha amarela mostrando trajetória
  - Contador de posições rastreadas

### 4. LoginPage (/login)
- **Layout:** Centrado verticalmente
- **Card:** Formulário compacto
- **Campos:** Email + Senha
- **Feedback:** Estado de carregamento nos componentes
- **Mensagens:** Contextuais com cores apropriadas

## 🎨 Detalhes Visuais

### Tipografia
- **Font:** Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Headings:** Amarelo (#ffc107), peso 700
- **Body:** Branco (#f5f7fa)

### Espaçamento
- **Padding padrão:** 24px em cards
- **Gap entre elementos:** 16px
- **Margem de botões:** 8-12px

### Bordas e Raios
- **Border-radius:** 8-12px em elementos
- **Borda cards:** 2px com cor amarela transparente
- **Hover:** Transição suave 0.3s

### Sombras
- **Cards padrão:** 0 4px 12px rgba(0,0,0,0.3)
- **Cards hover:** 0 6px 16px rgba(255,193,7,0.1)
- **Elevação:** Aumenta em hover

### Animações
- **Transform:** translateY(-2px) em botões
- **Opacity:** Transições suaves
- **Color:** Transições 0.3s ease

## 📊 Componentes Principais

### SessionStatus.tsx
- Badge "AO VIVO" em verde
- Flex layout com display de título
- Apenas visível se há sessão ativa

### LivePlayer.tsx
- Aspecto 16:9 (56.25% padding-top trick)
- Border-radius 12px
- Alerta se não configurado

### LiveMap.tsx
- Grid com informações de coordenadas
- Contador de posições
- Mapa Leaflet com altura fixa (480px)
- Marcador amarelo personalisado
- Linha de trajetória

## 💡 Boas Práticas Implementadas

1. **Accessibility:**
   - Labels associados com inputs via `htmlFor`
   - Buttons com textos descritivos
   - Contrast adequado entre texto e fundo

2. **Responsividade:**
   - Classes Bootstrap para grid fluido
   - Breakpoints em 768px e 900px
   - Mobile-first approach

3. **Performance:**
   - CSS inline minimizado
   - Bootstrap carregado uma vez no layout
   - Componentes dinâmicos com lazy loading

4. **UX:**
   - Feedback visual em todas as ações
   - Estados de carregamento claros
   - Mensagens de erro/sucesso contextuais
   - Tooltips e hints para ajudar usuário

## 🚀 Como Usar

### Desenvolvimento
```bash
npm run dev
# Servidor em http://localhost:3000
```

### Build
```bash
npm run build
npm run start
```

## 📝 Customizações Possíveis

### Alterar cores principais
Edite `:root` em `app/globals.css`:
```css
:root {
  --dark-gray: #1a1a1a;        /* Alterar tom escuro */
  --yellow-primary: #ffc107;   /* Alterar amarelo */
}
```

### Adicionar novo estilo
1. Adicione classe em `globals.css`
2. Use em componentes React
3. Bootstrap classes como fallback

### Personalizar componentes
Cada página/component pode receber props para customização:
```tsx
<button className="btn btn-primary btn-lg">
  Texto
</button>
```

## 📚 Referências

- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.0/)
- [Next.js CSS](https://nextjs.org/docs/basic-features/built-in-css-support)
- [Leaflet Docs](https://leafletjs.com/)

## ✨ Recursos Futuros

- [ ] Dark mode toggle
- [ ] Tema customizável
- [ ] Suporte a certificados SSL
- [ ] Notificações em tempo real
- [ ] Dashboard com estatísticas

---

**Última atualização:** 14 de Março de 2026
**Versão:** 1.0.0
