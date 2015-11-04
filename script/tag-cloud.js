$(document).ready(function() {
	// Static page layout (fragment):
	//    <h1>Articles</h1>
	//    <div id="tag-cloud"></div>
	//    <h2 id="[tag]" data-posts="[number of posts]">[tag]</h2>
	//    <ul>
	//      [ list of posts with this tag ]
	//    </ul>
	//    . . .

	// Overall process:
	//  * Find each article list header and extract the tag name and number
	//    of posts for each tag (from the <h2>'s attributes).
	//  * Create the tag cloud, with size of links' text proprortional to
	//    number of articles, also including accessibility info for
	//    non-visual browsers.
	//  * Make each tag cloud link point to the relevant existing statically-
	//    generated <h2>.

	var SIZE_MIN = 0.25;        // minimum font size (em)
	var SIZE_MAX = 4;           // maximum font size (em)
	var max_article_count = 0;  // for a given tag
	var tag_cloud_container = $('#tag-cloud');  // <div> containing the cloud
	// A mapping from tag name to number of articles and font size
	// The format is: { <tag_name>: { posts: <>, size: <> } }
	var tag_to_count = {};

	// Iterate over each <h2> to find the tag names and sizes.
	// The <h2>'s text is the tag name, and it has an attribute giving the
	// number of posts.
	$('h2').each(function() {
		var tag_name = $(this).attr('id');
		var article_count = $(this).attr('data-posts');
		tag_to_count[tag_name] = { posts: article_count };

		if( article_count > max_article_count ) {
			max_article_count = article_count;
		}
	});

	// Normalise the article count against the given scale
	// to form the font size for each tag.
	$.each(tag_to_count, function(tag_name, record) {
		var posts = record.posts;
		var rank = posts / max_article_count;
		record.size = SIZE_MIN + ( rank * ( SIZE_MAX - SIZE_MIN ) );
	});

	// Populate the tag cloud
	$.each(tag_to_count, function(tag_name, record) {
		tag_cloud_container.append(
			'<a ' +
			// Attributes
			'href="#' + tag_name + '"' +  // link to the <h2>
			'style="font-size: ' + record.size + 'em;">' +
			// Content
			tag_name +
			'<span class="visually-hidden"> (' + record.posts + ' ' +
			( record.posts > 1 ? 'articles' : 'article' ) +
			')</span></a>&nbsp; '
		);
	});
});
