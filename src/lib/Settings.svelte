<script>
  import { slidename, group, wsiurl, wsiport } from "../stores.js";
</script>

<label for="settings" class="btn btn-outline bg-gray-50 opacity-80 modal-button absolute top-4 right-4 z-50">settings</label>
<input type="checkbox" id="settings" class="modal-toggle" />
<div class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Settings</h3>
    <form>
      <div class="form-control w-full max-w-xs">
        <label for="slidename">slidename</label>
        <input
          bind:value={$slidename}
          id="slidename"
          type="text"
          placeholder={$slidename}
          class="input input-bordered w-full max-w-xs"
        />

        <label for="group">group</label>
        <input
          bind:value={$group}
          id="group"
          type="text"
          placeholder={$group}
          class="input input-bordered w-full max-w-xs"
        />

        <label for="wsiurl">wsiurl</label>
        <input
          bind:value={$wsiurl}
          id="wsiurl"
          type="text"
          placeholder={$wsiurl}
          class="input input-bordered w-full max-w-xs"
        />

        <label for="wsiport">wsiport</label>
        <input
          bind:value={$wsiport}
          id="wsiport"
          type="text"
          placeholder={$wsiport}
          class="input input-bordered w-full max-w-xs"
        />
      </div>
    </form>
    <div class="modal-action">
      <label for="settings" class="btn">Yay!</label>
    </div>
  </div>
</div>

