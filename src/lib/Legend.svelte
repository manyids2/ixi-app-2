<script>
  import { onMount, createEventDispatcher } from "svelte";
  import {
    slidename,
    slidenames,
    group,
    groups,
    wsiurl,
    wsiport,
    layers,
    scores,
    sv,
  } from "../stores.js";

  let slidenameText = $slidename;
  let slidenameOptions = $slidenames;

  onMount(async () => {
    let url = `/api/v1/wsi/groups`;
    console.log(url);
    let response = await fetch(url);
    let _groups = await response.json();

    // Groups
    _groups = _groups.filter((g) => {
      const parts = g.split(".");
      const ext = parts[parts.length - 1];
      return ext != "db" && ext != "sh";
    });

    $groups = _groups;

    // Slidenames
    url = `/api/v1/wsi/groups/${$group}/slides/`;
    response = await fetch(url);
    let _slidenames = await response.json();

    $slidenames = _slidenames;
    slidenameOptions = $slidenames;
  });

  function toggleLayer() {
    $sv?.updateLayers();
  }

  function chooseSlidename(event) {
    slidenameText = event.target.dataset.slidename;
    $slidename = slidenameText;
    dispatch("group-changed");
  }

  function filterSlidenames(event) {
    if (event.key === "Escape") {
      slidenameText = $slidename;
    }
    slidenameOptions = $slidenames.filter((s) => s.includes(slidenameText));
  }

  const dispatch = createEventDispatcher();
  function handleGroup(event) {
    $group = event.target.value;
    dispatch("group-changed");
  }
</script>

<div class="card absolute top-4 left-4 w-96 z-40">
  <div class="card-body bg-gray-50 opacity-80">
    <!-- slidename -->
    <div class="divider">slidename</div>

    <!-- choose slidename modal -->
    <label for="my-modal" class="card-title btn btn-outline modal-button h-full"
      >{$slidename}</label
    >
    <input type="checkbox" id="my-modal" class="modal-toggle" />
    <div class="modal">
      <div class="modal-box min-w-max h-full flex flex-col">
        <div class="flex flex-row w-screen justify-center">
          <input
            type="text"
            placeholder={slidenameText}
            bind:value={slidenameText}
            on:change={filterSlidenames}
            on:keyup={filterSlidenames}
            class="input input-bordered input-primary text-4xl h-full w-8/12 text-center"
          />
          <label for="my-modal" class="btn btn-primary text-4xl h-24"
            >Close</label
          >
        </div>
        <div class="modal-action w-screen min-h-max flex flex-col">
          {#each slidenameOptions as _name, _}
            <label
              for="my-modal"
              on:click={chooseSlidename}
              data-slidename={_name}
              class="btn btn-outline text-4xl h-24 w-full"
            >
              {_name.substring(5, 22)}
            </label>
          {/each}
        </div>
      </div>
    </div>

    <!-- group -->
    <div class="divider">model</div>
    <select
      class="select w-full max-w-xs"
      on:change={handleGroup}
      bind:value={$group}
    >
      {#each $groups as _group, _}
        <option>{_group}</option>
      {/each}
    </select>

    <!-- labels -->
    <div class="divider">labels</div>
    <div class="form-control">
      {#each $layers as layer, _}
        <label class="label cursor-pointer">
          <span class="label-text">{layer.name}</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            bind:checked={layer.enabled}
            on:change={toggleLayer}
          />
        </label>
      {/each}
    </div>

    <!-- scores -->
    <div class="divider">scores</div>
    <div class="overflow-x-auto">
      <table class="table w-full text-xs">
        <tbody>
          {#each Object.keys($scores) as name}
            <tr>
              <td>{name}</td>
              <td class="font-bold text-sm">{$scores[name]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
