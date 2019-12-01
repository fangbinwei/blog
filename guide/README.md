---
permalink: /guide
listHidden: true
---
<div class="post-list">
  <section class="post-sort" v-for="item in sameYearPosts">
    <div class="year" v-if="Number(item.year)!==thisYear">📆{{item.year}}</div>
    <div class="post" v-for="post in item.posts">
      <div class="post-title">
        <router-link :to="post.path">{{post.title}}</router-link>
      </div>
      <div class="post-date">
        {{dateFormatter(post.frontmatter.date)}} 
      </div>
    </div> 
  </section>
</div>

<script>
export default {
  data () {
    return {
      thisYear: new Date().getFullYear()
    }
  },
  computed: {
    posts () {
      const pages = this.$site.pages
      if (!pages) return []

      return pages.sort((x, y) => {
        return y.frontmatter.date - x.frontmatter.date
      })
    },
    sameYearPosts () {
      let postsYearMap = {}
      this.posts.forEach(post => {
        const year = new Date(post.frontmatter.date).getFullYear()
        if (post.frontmatter.listHidden) return
        if (!postsYearMap[year]) postsYearMap[year] = []
        postsYearMap[year].push(post)
      })

      // based on Object.keys order
      return Object.keys(postsYearMap).reverse().map(year => {
        return {year, posts: postsYearMap[year]}
      })
    }
  },
  methods: {
    dateFormatter (stamp) {
      const date = new Date(stamp)
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }
}
</script>
<style lang="less" scoped>
.post-list {
  .post-sort {
    padding-left: 16px;
    .year {
      margin: 8px 0;
      font-weight: bold;
      font-size: 20px;
    }
    .post {
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f4;
      font-size: 18px;
      &:last-of-type {
        border-bottom-width: 5px;
      }
      .post-title {
        text-transform: capitalize;
        font-weight: bold;
        text-shadow: 1px 1px 1px #f3f4f4;
        a {
          color: rgb(72, 72, 72);
          display: block;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          height: 100%;
          width: 100%;
        }
      }
      .post-date {
        font-size: 12px;
      }
    }
  }
}
</style>