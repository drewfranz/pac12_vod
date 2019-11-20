<?php

namespace Drupal\pac12_vod\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Class Pac12VODConfig.
 */
class Pac12VODConfig extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'pac12_vod.pac12vodconfig',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'pac12_vod_config';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    // Form constructor.
    $form = parent::buildForm($form, $form_state);
    // Default values
    $config = $this->config('pac12_vod.settings');

    // Add the configuration form fields
    $form['vod_list_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('VODs returned per page.'),
      '#max' => 256,
      '#min' => 1,
      '#step' => 1,
      '#default_value' => $config->get('pac12_vod.vod_list_limit'),
    ];
    $form['vod_infinite'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Infinate scrolling'),
      '#description' => $this->t('Infinite scrolling to the bottom of the cards causes the next set of VOD cards to load.'),
      '#default_value' => $config->get('pac12_vod.vod_infinite'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Get the config values.
    $config = \Drupal::configFactory()->getEditable('pac12_vod.settings');

    // Save the submitted values.
    $config->set('pac12_vod.vod_list_limit', $form_state->getValue('vod_list_limit'));
    $config->set('pac12_vod.vod_infinite', $form_state->getValue('vod_infinite'));
    $config->save();

    return parent::submitForm($form, $form_state);
  }

  /**
   * GET and build a list of Sports and thier IDs.
   * 
   * @return
   *  An object of items with the element 'id' being the sport ID,
   *  and 'sport' being the label.
   */
  private function getSchoolsObject() {
    $schools = {};

    return $schools;
  }
}
