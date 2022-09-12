<script>
  import { user } from "../stores.js";

  let shortName = $user.split(".")[0][0];
</script>

<div class="avatar online placeholder">
  <div class="bg-neutral-focus text-neutral-content rounded-full w-16">
    <span class="text-xl">{shortName}</span>
  </div>
</div>
