<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-icon">📄</span>
        <span class="brand-name">DocsFlow</span>
      </div>
      <div class="nav-links">
        <router-link to="/">문서 목록</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', 'Segoe UI', sans-serif;
  background: #f0f2f5;
  color: #1a1a2e;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #1a1a2e;
  padding: 0 32px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon { font-size: 24px; }

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #4f8ef7;
  letter-spacing: -0.5px;
}

.nav-links a {
  color: #a0aec0;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #ffffff;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
</style>