<?php

namespace Drupal\pac12_vod\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Class Pac12VODController.
 */
class Pac12VODController extends ControllerBase {

  /**
   * Build the List.
   *
   * @return string
   *   Return VOD List page.
   */
  public function list() {
    // Default settings.
    $config = \Drupal::config('pac12_vod.settings');

    $build = [
      '#theme' => 'pac12_vod',
      '#content' => '',
      '#attached' => [
        'library' => [
          'pac12_vod/pac12_vod',
        ],
        'drupalSettings' => [
          'pac12_vod' => [
            'vod_list_limit' => $config->get('pac12_vod.vod_list_limit'),
          ],
        ],
      ],
    ];

    return $build;
  }

}
