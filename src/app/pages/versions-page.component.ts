import { Component, ChangeDetectionStrategy } from "@angular/core";
import { allGameVersions, GameVersion } from "../../classes/model";

@Component({
  selector: "app-versions-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Game Versions & DLC</h2>
      <p>Available DLC per version</p>
    </div>
    <div class="grid">
      @for (gv of gameVersions; track gv.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">🔖</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ gv.superVersion.game.title }}</h3>
              <div class="card-meta">
                <span class="tag">{{ gv.superVersion.getVersionType() }}</span>
                @if (gv.superVersion.versionYear) {
                  <span class="tag">{{ gv.superVersion.versionYear }}</span>
                }
                <span class="tag tag-muted">{{ gv.getProvider() }}</span>
              </div>
            </div>
          </div>
          <div class="card-platforms">
            <span class="platforms-label">Platforms:</span>
            <span class="platforms-list">{{ gv.getPlayableOnTitles() }}</span>
          </div>
          @if (gv.dlcVersionsThatThisCanUse.length > 0) {
            <div class="card-dlc">
              <span class="dlc-label">Compatible DLC:</span>
              @for (dv of gv.dlcVersionsThatThisCanUse; track dv.id) {
                <span class="dlc-chip">{{ dv.dlc.title }} ({{ dv.dlc.firstRelease }})</span>
              }
            </div>
          }
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsPageComponent {
  gameVersions: GameVersion[] = allGameVersions;
}
