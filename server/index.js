const fetch = require('node-fetch');
const cheerio = require('cheerio');
const db = require('./db');

const delayHandler = (miliseconds) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, miliseconds);
  });
}

const getRestaurants = async (state, city) => {
  const url = `https://www.allmenus.com/${state.toLowerCase()}/${city.toLowerCase()}/-/`;
  const response = await fetch(url);
  const body = await response.text();
  const $ = cheerio.load(body);

  const promises = [];
  const restaurants = [];
  $('.restaurant-list-item').each((i, item) => {
    const $item = $(item); // make item a cheerio obj
    const header = $(item).find('h4.name');
    const name = header.text();
    const $anchore = $(header).find('a');
    const link = $anchore.attr('href');
    const id = $anchore.attr('data-masterlist-id');

    const address = [];
    $item.find('div.address-container .address').each((i, part) => {
      const $part = $(part);
      address.push($part.text().trim());
    });

    const cousine = $item.find('p.cousine-list').text().trim().split(', ');

    const restaurant = {
      id,
      name,
      address: address.join('\n'),
      cousine,
      state,
      city,
      link
    };

    var newRestaurantRef = db.collection('restaurants').doc(id);
    promises.push(newRestaurantRef.set(restaurant));
    restaurants.push(restaurant);
  });

  for(const restaurant of restaurants) {
    await getMenu(restaurant.id, restaurant.link);
    await delayHandler(1000);
  }

  await Promise.all(promises);
  console.log('done!!');
};

getRestaurants('ca', 'los-angeles');

const getMenu = async (id, link) => {
  const url = `https://www.allmenus.com${link}`;
  const response = await fetch(url);
  const body = await response.text();
  const $ = cheerio.load(body);

  const rawJSON = $($('script[type="application/ld+json"]')[0]).html().replace(/\n/g, '');
  const data = JSON.parse(rawJSON);

  if(data.hasMenu && data.hasMenu.length > 0) {
    const promises = [];
    data.hasMenu.forEach((menu) => {
      if(menu.hasMenuSection && menu.hasMenuSection.length > 0) {
        menu.hasMenuSection.forEach((section) => {
          if(section.hasMenuItem && section.hasMenuItem.length > 0) {
            section.hasMenuItem.forEach((item) => {
              item.restaurant_id = id;
              item.menu_name = menu.name;
              item.menu_section_name = section.name;
              item.geo = data.geo;
              promises.push(db.collection('menu_items').add(item));
            });
          }
        });
      }
    });
    await Promise.all(promises);
    console.log('Menu item inserted!!!!!');
  } else {
    console.log('menu not found!')
  }
}

// getMenu('350980', '/ca/los-angeles/350980-roberts-russian-cuisine/menu/');