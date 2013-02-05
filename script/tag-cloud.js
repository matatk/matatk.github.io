$(document).ready(function() 
{
	// FIXME explain flow; removing <dl> eventually

	var PREFIX_LIST = "list-";  // used as part of @id for static <ul>s
	var PREFIX_LINK = "link-";  // used as part of @id for cloud <a>s
	var SIZE_MIN = 0.25;
	var SIZE_MAX = 4;
	var max_article_count = 0;  // for a given tag
	var tag_to_count = {};
	// A mapping from tag name to number of articles and font size
	// The format is [tag_name]: { raw: [article_count], size: [] }
	var tag_cloud_container;
	var article_list_container;
	var struct = $("#posts-by-tag");
	
	// Create the tag cloud area
	tag_cloud_container = $('<div '
		+ 'id="tag-cloud">'
		+ '<a name="cloud"></a>'  // allows us to return the user here
		+ '</div>'
	).insertBefore(struct);

	// Create an anchor that takes the user to just before the list of
	// articles for a given tag.  This allows us to put the user in the
	// right place on the page, even if the article list has not yet
	// appeared due to ongoing DOM manipulations.
	// Thanks to <http://blog.ginader.de/> for the tipoff!
	$('<a '
		+ 'name="list" '
		+ 'tabindex="-1" '
		+ 'class="hidden">'
		+ 'Article list</a>'  // Doesn't seem to get announced, but is needed
	).insertAfter(tag_cloud_container);

	// Create a holding area for the lists of articles.
	article_list_container = $('<div '
		+ 'id="article-list-container" '
		+ '</div>'
	).insertAfter(struct);

	// Create a link that returns the user to the tag cloud after
	// they have gone through the article list
	$('<a '
		+ 'href="#cloud" '
		+ 'class="hidden">'
		+ 'Return to tag cloud</a>'
	).insertAfter(article_list_container);

	// Iterate over each <ul> in the <dl> to find the tag names and sizes.
	// The <ul>'s id includes the tag name, and its length is the size.
	// Make the <ul> hidden, then move it to the article list container.
	struct.find("ul").each(function(index, element)
	{
		var tag_name = $(element).attr("id").slice(PREFIX_LIST.length);
		var article_count = $(element).children().length;
		tag_to_count[tag_name] = { raw: article_count };

		if( article_count > max_article_count )
		{
			max_article_count = article_count;
		}

		$(element).hide();
		$(element).attr('aria-hidden', 'true');  // until full HTML5 support
		$(element).attr('hidden', 'true');
		$(element).appendTo(article_list_container);
	});

	// Normalise the article count against the given scale
	// to form the font size for each tag.
	$.each(tag_to_count, function(tag_name, record)
	{
		var raw = record.raw;
		var rank = raw / max_article_count;
		record.size = SIZE_MIN + ( rank * ( SIZE_MAX - SIZE_MIN ) );
	});

	// Debugging
	//console.log("tag_to_count:", tag_to_count);
	
	// Populate the tag cloud
	$.each(tag_to_count, function(tag_name, record)
	{
		tag_cloud_container.append(
			'<a '
			// Attributes
			+ 'href="#list" '
			+ 'id="' + PREFIX_LINK + tag_name + '" '
			+ 'style="font-size: ' + record.size + 'em;">'
			// Content
			+ tag_name
			+ '<span class="hidden"> (' + record.raw
			+ ( record.raw > 1 ? ' articles' : ' article' )
			+ ")</span></a>&nbsp; "
		);
	});

	// Attach a show function to the tag cloud links
	$("#tag-cloud a").click(function() {
		var list_id = PREFIX_LIST + this.id.slice(PREFIX_LINK.length);
		var target = $('#' + list_id);
		
		// Hide all <ul>s currently in the live region
		article_list_container
			.children()
			.attr('aria-hidden', 'true')  // until browsers support HTML5
			.attr('hidden', 'true')
			.hide('fast');

		// Show the one in which we are interested
		$(target)
			.attr('aria-hidden', 'false')  // until browsers support HTML5
			.removeAttr('hidden')
			.show('slow');
	});
	
	// Now that all of the <ul>s are in the live area...
	struct.remove();
});
