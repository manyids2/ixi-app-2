<script>
  import { onMount } from "svelte";
  import { OpenSeadragonSlideViewer } from "../lib/osd";

  import Settings from "../lib/Settings.svelte";
  import Legend from "../lib/Legend.svelte";
  import Region from "../lib/Region.svelte";
  import {
    slidename,
    group,
    wsiurl,
    wsiport,
    appport,
    deepdive,
    positions,
    regions,
    tags,
    alltags,
    scores,
    layers,
    sv,
  } from "../stores.js";

  console.log(window.location);
  const _url = new URL(document.location.href);
  const _slidename = _url.searchParams.get("slidename");
  const _group = _url.searchParams.get("group");
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
    const _href = new URL(document.location.href);
    const _path = `${_href.origin}${_href.pathname}?slidename=${$slidename}&group=${$group}`;
    window.history.pushState({}, "", _path);

    // Open the new slide
    let url = `${$wsiurl}:${$wsiport}/api/v1/wsi/groups/${$group}/slides/${$slidename}`;
    $sv.open({ url }).then(() => {
      $layers = $sv._ctx.info.layers;

      url = `${$wsiurl}:${$appport}/slideinfo/${$deepdive}/${$slidename}`;
      fetch(url)
        .then((response) => response.json())
        .then((slideinfo) => {
          $scores = slideinfo.scores;
          $positions = slideinfo.positions;
          $regions = slideinfo.regions;
          $tags = slideinfo.tags;
          $alltags = slideinfo.alltags;
          console.log(slideinfo);
        })
        .catch();
    });
  }

  function updateTags(event) {
    const idx = event.detail.idx;
    console.log(idx);
    const comment = {
      slidename: $slidename,
      deepdive: $deepdive,
      comment: "",
      tags: $tags[idx].join(","),
      idx: idx,
    };
    let url = `${$wsiurl}:${$appport}/comment`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(comment),
    })
      .then((response) => response.json())
      .then((commentinfo) => {
        $tags[idx] = commentinfo.region.tags.split(",");
      });
  }
</script>

<Settings />
<Legend on:group-changed={updateSV} />
<Region on:tags-changed={updateTags} />
<div id="wsi" />
