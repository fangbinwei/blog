<template>
  <div class="theme-container">
    <div class="theme-default-content">
      <h1>404</h1>
      <blockquote>{{ getMsg() }}</blockquote>
      <router-link to="/">
        Take me home.
      </router-link>

      <div class="ghost">
        <div class="eye" />
        <div class="eye two" />

        <div class="mouth">
          <div class="tonge" />
        </div>

        <div class="corner" />
        <div class="corner two" />
        <div class="corner three" />
        <div class="corner four" />

        <div class="over" />
        <div class="over two" />
        <div class="over three" />
        <div class="over four" />

        <div class="shadow" />
      </div>
    </div>
  </div>
</template>

<script>
const msgs = [
  `There's nothing here.`,
  `How did we get here?`,
  `That's a Four-Oh-Four.`,
  `Looks like we've got some broken links.`
]
export default {
  methods: {
    getMsg() {
      return msgs[Math.floor(Math.random() * msgs.length)]
    }
  }
}
</script>

<style lang="less" scoped>
.corner {
  width: 21px;
  height: 21px;
  border-radius: 5px;
  background-color: #f8f8f8;
  border: 3px solid #979797;
  position: absolute;
  margin-top: 188px;
  transform: rotate(45deg);
  z-index: -1;
  box-sizing: content-box;
}
.corner.two {
  margin-left: 33px;
}
.corner.three {
  margin-left: 66px;
}
.corner.four {
  margin-left: 98px;
}
.over {
  width: 27px;
  height: 27px;
  border-radius: 3px;
  background-color: #fff;
  position: absolute;
  margin-top: 188px;
  transform: rotate(45deg) translateX(3px) translateY(3px);
}
.over.two {
  margin-left: 33px;
}
.over.three {
  margin-left: 66px;
}
.over.four {
  margin-left: 98px;
}
.eye {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  background-color: #979797;
  position: absolute;
  margin: 50px auto;
  left: 0;
  right: 0;
  transform: translateX(-25px);
}
.eye.two {
  transform: translateX(25px);
}
.mouth {
  width: 40px;
  height: 4px;
  border-radius: 10px;
  background-color: #979797;
  position: absolute;
  margin: 75px auto;
  left: 0;
  right: 0;
}
.tonge {
  width: 4px;
  height: 10px;
  border-radius: 0px 0px 50px 50px;
  background-color: #c39797;
  position: absolute;
  margin: 2px auto;
  left: 0;
  right: 0;
  transform: translateX(-6px);
  border-left: 5px solid #dfb1b1;
  border-right: 5px solid #dfb1b1;
  border-bottom: 5px solid #dfb1b1;
}
.ghost {
  width: 125px;
  height: 200px;
  background-color: #f8f8f8;
  border: 3px solid #979797;
  position: fixed;
  margin: auto;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 150px 150px 7px 7px;
  animation: ghost 2s ease-in-out alternate infinite;
  z-index: 1;
  box-sizing: content-box;
}
.shadow {
  width: 120px;
  height: 30px;
  border-radius: 100%;
  background-color: #d8d8d8;
  position: absolute;
  margin: 230px auto;
  left: 0;
  right: 0;
  animation: shadow 2s ease-in-out alternate infinite;
}
@keyframes shadow {
  0% {
    transform: scale(1) translateY(0px);
  }
  100% {
    transform: scale(0.8) translateY(75px);
  }
}
@keyframes ghost {
  0% {
    transform: scale(1) translateY(0px);
  }
  100% {
    transform: scale(1) translateY(-40px);
  }
}
</style>
