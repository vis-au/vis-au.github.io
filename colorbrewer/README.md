ColorBrewer-Lite
==============

This project extends the popular [ColorBrewer](http://colorbrewer2.org/) -- a web tool for guidance in choosing choropleth map color schemes -- for modifying color scales in Vega-Lite specifications.

To achieve this, we utilize [ReModel's](https://www.npmjs.com/package/remodel-vis) import and export classes to modify color encodings in all partial views in composite visualizations.
After selecting a target view, all color encodings from Vega-Lite (```color```, ```fill```, ```stroke```) can be set, mapping to any field of the included dataset.

ColorBrewer is based on the research of [Dr. Cynthia Brewer](http://www.personal.psu.edu/cab38/). Built and maintained by [Axis Maps](http://axismaps.com).

Questions, problems, or other feedback? [File an issue!](https://github.com/vis-au/colorbrewer/issues)

## Using this Tool
Enter a [Vega-Lite specification](https://vega.github.io/vega-lite) into the textfield in the left panel and click import.
(Note: When importing a specification from the [Vega-Lite examples page](https://vega.github.io/vega-lite/examples/), URLs are relative to the Vega website, so to correctly render the specification in ColorBrewer, change any URLs to ```https://vega.github.io/editor/YOUR_DATA_URL```, where ```YOUR_DATA_URL``` takes the relative path from the example specification.)
Your specification will be rendered in the panel on the right.
In the left box below the text field, entries for all views, encodings and fields will appear, based on the specification you imported.

In order to change a color mapping, select a view from the list below that contains all views that define a color encoding in your Vega-Lite specification in the order in which they appear.
Next, select the visual variable that you would like to represent with a color scheme, which in Vega-Lite are ```color```, ```fill``` and ```stroke```.
Then, select a field from the list the color should represent.
This list contains all fields that are contained in the original dataset, but does not contain properties added to the data through transformations.
If you want to map color to a field that is not listed, you can enter it into the text field below and press enter.

Afterwards, you can pick a color scheme from the top of the left panel, using the dropdown panel to select the number of shades.
Make sure to select the correct data type in from the three options "quantitative", "nominal" and "ordinal".