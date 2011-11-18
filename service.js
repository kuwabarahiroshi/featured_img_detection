#!/usr/local/bin/node

var http = require('http')
    , url = require('url')
    , im = require('imagemagick')
    , $ = require('jquery')
    , args = process.argv.slice(2)
    , page_url = args.pop()
    , options = args
    , parsed_url = url.parse(page_url)
    ;

http.get({
    host: parsed_url.host
    , port: parsed_url.port || 80
    , path: parsed_url.path
}, function(res) {
    var buffer = '';
    res.on('data', function(chunk) {
        buffer += chunk;
    });
    res.on('end', function() {
        parse(buffer);
    })
}).on('error', function(e) {
    console.error('Error on HTTP GET: ' + e.message);
});


function parse(html) {
    var imgs = $(html).find('img')
        , length = imgs.length
        , imgs_data = []
        ;

    [].slice.call(imgs).forEach(function(img, index) {
        var uri = url.resolve(page_url, $(img).attr('src'));
        im.identify(uri, function(err, features) {
            if (err) {
                console.error(err);
            } else {
                features.uri = uri;
                features.index = index;
                imgs_data.push(features);
            }

            if (--length) return;
            detect_featured_image(imgs_data);
        });
    });
}

function detect_featured_image(data) {
    var sorted = data.sort(function(a, b) {
        return score(a) - score(b);
    });

    console.log(sorted.pop().uri);
}

function score(feature) {
    var area = feature.width * feature.height
        , order = feature.index * 20
        , ratio = ( Math.min(feature.width, feature.height) / Math.max(feature.width, feature.height) ) * ( 4 / 3 );
        ;

    return (area * ratio) - order;
}
