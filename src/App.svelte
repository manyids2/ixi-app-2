<script>
  import { Router, Route } from "svelte-navigator";
  import Home from "./pages/Home.svelte";
  import Slide from "./pages/Slide.svelte";
</script>

<Router>
  <Route path="/">
    <Home />
  </Route>

  <Route path="slides">
    <Slide />
  </Route>

</Router>
