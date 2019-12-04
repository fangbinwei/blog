<template>
  <main class="home" aria-labelledby="main-title">
    <canvas ref="canvas" class="bg-canvas"></canvas>
    <header class="hero">
      <img
        v-if="data.heroImage"
        :src="$withBase(data.heroImage)"
        :alt="data.heroAlt || 'hero'"
        @dragstart.prevent
      />

      <h1 v-if="data.heroText !== null" id="main-title">
        {{ data.heroText || $title || 'Hello' }}
      </h1>

      <p class="description">
        {{ data.tagline || $description || 'Welcome to your VuePress site' }}
      </p>

      <p v-if="data.actionText && data.actionLink" class="action">
        <NavLink class="action-button" :item="actionLink" />
      </p>
    </header>

    <div v-if="data.features && data.features.length" class="features">
      <div
        v-for="(feature, index) in data.features"
        :key="index"
        class="feature"
      >
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.details }}</p>
      </div>
    </div>

    <Content class="theme-default-content custom" />

    <div v-if="data.footer" class="footer">
      {{ data.footer }}
    </div>
  </main>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue'

export default {
  components: { NavLink },

  computed: {
    data() {
      return this.$page.frontmatter
    },

    actionLink() {
      return {
        link: this.data.actionLink,
        text: this.data.actionText
      }
    }
  },
  mounted() {
    const c = this.$refs.canvas
    let x = c.getContext('2d'),
      pr = window.devicePixelRatio || 1,
      w = window.innerWidth,
      h = window.innerHeight,
      f = 90,
      q,
      m = Math,
      r = 0,
      u = m.PI * 2,
      v = m.cos,
      z = m.random
    c.width = w * pr
    c.height = h * pr
    c.style.width = w + 'px'
    c.style.height = h + 'px'

    x.scale(pr, pr)
    x.globalAlpha = 0.6
    function i(e) {
      x.clearRect(0, 0, w, h)
      q = [{ x: 0, y: h * 0.7 + f }, { x: 0, y: h * 0.7 - f }]
      while (q[1].x < w + f) d(q[0], q[1])

      e && e.preventDefault()
    }
    function d(i, j) {
      x.beginPath()
      x.moveTo(i.x, i.y)
      x.lineTo(j.x, j.y)
      var k = j.x + (z() * 2 - 0.25) * f,
        n = y(j.y)
      x.lineTo(k, n)
      x.closePath()
      r -= u / -50
      x.fillStyle =
        '#' +
        (
          ((v(r) * 127 + 128) << 16) |
          ((v(r + u / 3) * 127 + 128) << 8) |
          (v(r + (u / 3) * 2) * 127 + 128)
        ).toString(16)
      x.fill()
      q[0] = q[1]
      q[1] = { x: k, y: n }
    }
    function y(p) {
      var t = p + (z() * 2 - 1.1) * f
      return t > h || t < 0 ? y(p) : t
    }
    c.addEventListener('click', i)
    c.addEventListener('touchstart', i, { passive: false })
    i()
  }
}
</script>

<style lang="stylus">
.home
  user-select none
  padding $navbarHeight 2rem 0
  max-width 960px
  margin 0px auto
  display block
  .bg-canvas
    position fixed
    left 0
    top 3.6rem
  .hero
    position relative
    text-align center
    img
      max-width: 100%
      max-height 280px
      display block
      margin 3rem auto 1.5rem
    h1
      font-size 3rem
    h1, .description, .action
      margin 1.8rem auto
    .description
      max-width 35rem
      font-size 1.6rem
      line-height 1.3
      color lighten($textColor, 40%)
    .action-button
      display inline-block
      font-size 1.2rem
      color #fff
      background-color $accentColor
      padding 0.8rem 1.6rem
      border-radius 4px
      transition background-color .1s ease
      box-sizing border-box
      border-bottom 1px solid darken($accentColor, 10%)
      &:hover
        background-color lighten($accentColor, 10%)
  .features
    border-top 1px solid $borderColor
    padding 1.2rem 0
    margin-top 2.5rem
    display flex
    flex-wrap wrap
    align-items flex-start
    align-content stretch
    justify-content space-between
  .feature
    flex-grow 1
    flex-basis 30%
    max-width 30%
    h2
      font-size 1.4rem
      font-weight 500
      border-bottom none
      padding-bottom 0
      color lighten($textColor, 10%)
    p
      color lighten($textColor, 25%)
  .footer
    padding 2.5rem
    border-top 1px solid $borderColor
    text-align center
    color lighten($textColor, 25%)

@media (max-width: $MQMobile)
  .home
    .features
      flex-direction column
    .feature
      max-width 100%
      padding 0 2.5rem

@media (max-width: $MQMobileNarrow)
  .home
    padding-left 1.5rem
    padding-right 1.5rem
    .hero
      img
        max-height 210px
        margin 2rem auto 1.2rem
      h1
        font-size 2rem
      h1, .description, .action
        margin 1.2rem auto
      .description
        font-size 1.2rem
      .action-button
        font-size 1rem
        padding 0.6rem 1.2rem
    .feature
      h2
        font-size 1.25rem
</style>
