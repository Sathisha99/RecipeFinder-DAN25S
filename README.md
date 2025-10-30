# RecipeFinder-DAN25S
Final Project – Skriptspråk och databashantering (Recipe Finder using TheMealDB API)

**Recipe Finder**

**Live Demo:** [Recipe Finder on GitHub Pages](https://sathisha99.github.io/RecipeFinder-DAN25S/)

This is my final project for the course Programming Fundamentals (DAN25S) at Medieinstitutet.

The project is a small web application built with HTML, CSS, and JavaScript that connects to TheMealDB API.
It lets users search for recipes, sort and filter them, view details, and save favorites. I also added a panel that shows the most common ingredients from the current list of results.

**Main Features**

Search meals by name (data from TheMealDB)

Filter by category

Sort results A → Z or Z → A

Change number of results per page

Pagination (Next / Previous)

View detailed recipe info (image, category, ingredients, instructions)

Add or remove favorites (saved in the browser)

Ingredient frequency panel (extra feature)

**How it Works**

The app uses fetch() and async / await to get data from TheMealDB API.

The data is processed with array methods such as .map(), .filter(), .sort(), and .reduce().

The page is updated dynamically with JavaScript – no page reloads.

Favorites are stored in localStorage, so they stay even after reloading.

**How to Run**

Download or clone this repository.

Open the folder in WebStorm or any code editor.

Right-click index.html and choose Open in Browser.

Make sure the address in the browser looks like
http://localhost:63342/RecipeFinder-DAN25S/index.html
(no _ijt or _ij_reload at the end).

**Files**

index.html       – main page
css/styles.css   – styling
js/app.js        – JavaScript code
README.md        – project information

**API Source**

All meal data comes from:
https://www.themealdb.com/api.php

**Example Demo Steps**

Open the page – categories appear automatically.

Type a keyword like “chicken” in the search box.

Use Sort and Category filters.

Click Details to see ingredients and instructions.

Add a few recipes to Favorites and switch to “Favorites only” view.

Watch how the ingredient panel updates.

**Notes**

Built using HTML5, CSS3, and JavaScript (ES6).

No frameworks used.

Works best in Chrome or Edge.
