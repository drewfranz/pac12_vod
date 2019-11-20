<?php

namespace Drupal\pac12_vod\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\BlockPluginInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Cache\Cache;

/**
 * Provides a VOD List Block.
 * 
 * @Block(
 *   id = "pac12_vod_list_block",
 *   admin_label = @Translation("Pac-12 VOD List"),
 *   category = @Translation("Pac-12 VOD"),
 * )
 */
class Pac12VODListBlock extends BlockBase implements BlockPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function build() {
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
            'vod_list_limit' => $config->get('pac12_vod.vod_block_list_limit'),
          ],
        ],
      ],
    ];

    return $build;
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    // Form constructor.
    $form = parent::blockForm($form, $form_state);

    // Load default values
    $config = \Drupal::configFactory()->getEditable('pac12_vod.settings');

    // Add the limit form field
    $form['pac12_vod']['vod_block_list_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('VODs returned per block.'),
      '#max' => 256,
      '#min' => 1,
      '#step' => 1,
      '#default_value' => $config->get('pac12_vod.vod_block_list_limit'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    parent::blockSubmit($form, $form_state);

    // Default values
    $config = \Drupal::configFactory()->getEditable('pac12_vod.settings');
    // Submitted values
    $values = $form_state->getValues();

    // Save the new submitted values
    $config->set('pac12_vod.vod_block_list_limit', $values['pac12_vod']['vod_block_list_limit']);
    $config->save();

    // We need to invalidate the cache tags for this block so the changes show up.
    \Drupal::service('cache_tags.invalidator')->invalidateTags(['pac12_vod_block_list_limit']);
  }

  public function getCacheTags() {
    // Add a new cache tag for this block so we can invalidate it during submission.
    return Cache::mergeTags(parent::getCacheTags(), ['pac12_vod_block_list_limit']);
 }
}
