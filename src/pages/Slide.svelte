<script>
  import { onMount } from "svelte";
  import { OpenSeadragonSlideViewer } from "../lib/osd";

  import Settings from "../lib/Settings.svelte";
  import Legend from "../lib/Legend.svelte";
  import {
    slidename,
    group,
    wsiurl,
    wsiport,
    appport,
    deepdive,
    scores,
    layers,
    sv,
  } from "../stores.js";

  console.log(window.location);
  let _url = new URL(document.location.href);
  let _slidename = _url.searchParams.get("slidename");
  let _group = _url.searchParams.get("group");
  if (_slidename != null) {
    console.log(_slidename);
    $slidename = _slidename;
  }
  if (_group != null) {
    console.log(_group);
    $group = _group;
  }

  onMount(async () => {
    $sv = new OpenSeadragonSlideViewer({
      id: "wsi",
      onFullyLoaded: () => {
        console.log("loaded!");
      },
      onCenterChange: null,
    });
    updateSV();
  });

  function updateSV() {
    // Update the url
    let _href = new URL(document.location.href);
    let _path = `${_href.origin}${_href.pathname}?slidename=${$slidename}&group=${$group}`;
    window.history.pushState({}, "", _path);

    // Open the new slide
    let url = `/api/v1/wsi/groups/${$group}/slides/${$slidename}`;
    $sv.open({ url }).then((result) => {
      console.log(result);
      $layers = $sv._ctx.info.layers;

      //url = `/slideinfo/${$deepdive}/${$slidename}`;
      //response = fetch(url)
      //  .then((response) => response.json())
      //  .then((slideinfo) => {
      //    $scores = slideinfo.scores;
      //    console.log($scores);
      //  });
    });
  }

</script>

<Legend on:group-changed={updateSV} />
<div id="wsi" />
<div id="lym">
  <img id="lym-img" src="/lym/v1/{$slidename}.png" alt="{$slidename}" title="right click, open in new tab to see full image."/>
</div>
