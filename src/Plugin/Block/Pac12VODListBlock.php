<?php

namespace Drupal\pac12_vod\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Cache\Cache;
use Symfony\Component\DependencyInjection\ContainerInterface;
use GuzzleHttp\Client;

/**
 * Provides a VOD List Block.
 * 
 * @Block(
 *   id = "pac12_vod_list_block",
 *   admin_label = @Translation("Pac-12 VOD List"),
 *   category = @Translation("Pac-12 VOD"),
 * )
 */
class Pac12VODListBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * Guzzle\Client instance.
   *
   * @var \Guzzle\Client
   */
  protected $httpClient;

  /**
   * @param array $configuration
   * @param string $plugin_id
   * @param mixed $plugin_definition
   * @param \Guzzle\Client $http_client
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, Client $http_client) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->httpClient = $http_client;
  }

  /**
   * @param \Symfony\Component\DependencyInjection\ContainerInterface $container
   * @param array $configuration
   * @param string $plugin_id
   * @param mixed $plugin_definition
   *
   * @return static
   */
  public static function create(ContainerInterface $container,array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('http_client')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Default settings.
    $config = \Drupal::config('pac12_vod.settings');

    $build = [
      '#theme' => 'pac12_vod_block',
      '#attached' => [
        'library' => [
          'pac12_vod/pac12_vod',
        ],
        'drupalSettings' => [
          'pac12_vod' => [
            'vod_block_list_limit' => $config->get('pac12_vod.vod_block_list_limit'),
            'vod_block_list_sport' => $config->get('pac12_vod.vod_block_list_sport'),
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

    // GET a list of all sports
    $sports = json_decode($this->_getSchoolsObject(), false);
    $sportsArr = [
      0 => "- All -",
    ];

    // And create an options array
    foreach ($sports->sports as $sport) {
      $sportsArr[$sport->id] = $sport->name;
    }

    // Add the limit form field
    $form['pac12_vod']['vod_block_list_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('VODs returned per block.'),
      '#max' => 256,
      '#min' => 1,
      '#step' => 1,
      '#default_value' => $config->get('pac12_vod.vod_block_list_limit'),
    ];
    $form['pac12_vod']['vod_block_list_sport'] = [
      '#type' => 'select',
      '#title' => $this->t('Select sport'),
      '#options' => $sportsArr,
      '#default_value' => $config->get('pac12_vod.vod_block_list_sport'),
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
    $config->set('pac12_vod.vod_block_list_sport', $values['pac12_vod']['vod_block_list_sport']);
    $config->save();

    // We need to invalidate the cache tags for this block so the changes show up.
    \Drupal::service('cache_tags.invalidator')->invalidateTags(['pac12_vod_block_list']);
  }

  public function getCacheTags() {
    // Add a new cache tag for this block so we can invalidate it during submission.
    return Cache::mergeTags(parent::getCacheTags(), ['pac12_vod_block_list']);
 }

  /**
   * GET and build a list of Sports and thier IDs.
   *
   * @return
   *  An array of object items with the element 'id' being the sport ID,
   *  and 'sport' being the label.
   */
  private function _getSchoolsObject() {
    $sports = [];
    $request = $this->httpClient->get('https://api.pac-12.com/v3/sports', []);

    if ($request->getStatusCode() != 200) {
      return $sports;
    }

    $res = $request->getBody();

    return $res->getContents();
  }
}
