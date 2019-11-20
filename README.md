## Pac-12 VOD
Pac-12 VOD is a Drupal 8 module for embedding a list of Pac-12 Network Video On Demand elements into your Drupal site.

### Installation
Clone the repo to your site and copy into the `/docroot/modules/custom `directory. The using Drush you can install the module with the following commands:

```
drush en pac12_vod
drush cr
```

### Usage
The module by default creates a list page that shows the first 10 Video On Demand items. The page can be access at `https://yoursite.com/vod/list`. You can configure the number of videos listed in the `Configuration>Web Services>Pac-12 Video On Demand` area of the Drupal Administration.

Additionally, the module adds a block to the Drupal site that allows you to add a list of Video On Demand items to any region. To add the block, go to `Structure>Block Layout` and click `Place Block`. Search for the `Pac-12 VOD List` block. Once you have added the block to a region you can also configure the number of items listed.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
