$(document).ready(function() 
{
	var PREFIX_LIST = "list-";  // used as part of @id for static <ul>s
	var PREFIX_LINK = "link-";  // used as part of @id for cloud <a>s
	var SIZE_MIN = 0.25;
	var SIZE_MAX = 4;
	var LIVE_REGION_ID = 'article-list-area';
	var max_article_count = 0;  // for a given tag
	var struct = $("#posts-by-tag");
	var live_region;
	var tag_cloud;
	var tag_to_count = {};
	// A mapping from tag name to number of articles and font size
	// The format is [tag_name]: { raw: [article_count], size: [] }

	// The <dl> structure that lists all the tags and articles for each
	// is good for static presentation, but in order to show/hide the
	// article lists, we need to extract them from it (or they'll be
	// removed when the containing <dl> is removed).
	
	// Create a holding area for the lists of tags, changes to which will
	// be announced to users of assistive technologies.
	live_region = $('<div '
		+ 'id="' + LIVE_REGION_ID + '" '
		+ 'aria-live="polite">'
		+ '</div>'
	).insertAfter(struct);

	// Iterate over each <ul> in the <dl> to find the tag names and sizes.
	// The <ul>'s id includes the tag name, and its length is the size.
	// Make the <ul> hidden, then move it to the live region for later.
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
		$(element).appendTo('#' + LIVE_REGION_ID);
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
	
	// Create the tag cloud
	tag_cloud = $('<div '
		+ 'id="tag-cloud">'
		+ '</div>'
	).insertBefore(struct);

	// Populate the tag cloud
	$.each(tag_to_count, function(tag_name, record)
	{
		var tag_link = tag_cloud.append(
			'<a '
			// Attributes
			+ 'href="#" '
			+ 'role="button" '
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
		$('#' + LIVE_REGION_ID)
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
	
	// Suppress SPACE scrolling behaviour; use as activation
	$('#tag-cloud a').keydown(function(event) {
		if( event.keyCode == 32 ) {
			this.click();
			event.preventDefault();
		}
	});

	// Now that all of the <ul>s are in the live area...
	struct.remove();
});
