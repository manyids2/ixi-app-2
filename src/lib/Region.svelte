<script>
  import {
    slidename,
    sv,
    regions,
    positions,
    tags,
    alltags,
    wsiurl,
    appport,
    deepdive,
  } from "../stores.js";
  import { onMount, createEventDispatcher } from "svelte";

  function handleAdd() {
    if ($sv) {
      const viewer = $sv._osd;
      const viewportBounds = viewer.viewport.getBounds(true);
      const viewportImageRectangle =
        $sv.tiledImage.viewportToImageRectangle(viewportBounds);
      const bounds = viewportImageRectangle;
      const position = $sv.getCurrentViewportPosition();

      let url = `${$wsiurl}:${$appport}/region`;
      let region = {
        slidename: $slidename,
        deepdive: $deepdive,
        top: parseFloat(bounds.y),
        left: parseFloat(bounds.x),
        height: parseFloat(bounds.height),
        width: parseFloat(bounds.width),
        cenx: parseFloat(position.x),
        ceny: parseFloat(position.y),
        z: parseFloat(position.z),
        comment: "",
        tags: "",
      };
      console.log(region);
      fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(region),
      })
        .then((response) => response.json())
        .then((regioninfo) => {
          console.log(regioninfo);
          $regions[regioninfo.idx] = bounds;
          $positions[regioninfo.idx] = position;
          $tags[regioninfo.idx] = "";
        });
    }
  }

  function gotoRegion(event) {
    if ($sv) {
      const idx = event.target.dataset.idx;
      const position = $positions[idx];
      $sv.moveTo(position);
    }
  }

  const dispatch = createEventDispatcher();
  function handleTag(event) {
    // reinit from tags
    let checked = {};
    Object.keys($regions).forEach((idx) => {
      $alltags.forEach((tag) => {
        checked[tag] = $tags[idx].includes(tag);
      });
    });

    // Make changes
    const idx = event.target.dataset.idx;
    const tag = event.target.dataset.tag;
    checked[tag] = !checked[tag];

    // Get new tags
    let _tags = [];
    $alltags.forEach((tag) => {
      if (checked[tag]) {
        _tags = [..._tags, tag];
      }
    });
    $tags[idx] = _tags;
    console.log($tags);
    dispatch("tags-changed", { idx });
  }
</script>

<div class="card absolute bottom-4 right-4 min-w-max z-40">
  <div class="card-body bg-gray-50 opacity-80">
    <div class="card-body h-full btn">Regions</div>
    {#each Object.keys($regions) as idx}
      <div class="flex-row">
        <div class="btn h-full min-w-max">
          {idx}
        </div>
        <div class="btn btn-outline" data-idx={idx} on:click={gotoRegion}>
          🎯
        </div>

        <label for={`tags-modal-${idx}`} class="btn modal-button"
          >labels</label
        >
        <input type="checkbox" id={`tags-modal-${idx}`} class="modal-toggle" />
        <label for={`tags-modal-${idx}`} class="modal cursor-pointer">
          <label class="modal-box relative" for="">
            <div class="flex flex-col">
              {#each $alltags as tag}
                <div
                  class={$tags[idx].includes(tag)
                    ? "btn btn-primary mt-4"
                    : "btn mt-4"}
                  on:click={handleTag}
                  data-idx={idx}
                  data-tag={tag}
                >
                  {tag}
                </div>
              {/each}
            </div>
          </label>
        </label>
      </div>
    {/each}
    <div class="card-title btn btn-outline" on:click={handleAdd}>+</div>
  </div>
</div>
