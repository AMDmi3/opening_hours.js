/**
Generate taginfo.json for this project.
See: https://wiki.openstreetmap.org/wiki/Taginfo/Projects

Confirmed working for targets:
* Neko
* Java
* C++
* PHP (also produces the exact same output as gen_taginfo_json.js does ;) )

Not working for:
* Python
* JavaScript
**/
/*
haxe -main Gen_taginfo_json -lib mcli -neko Gen_taginfo_json.n && neko Gen_taginfo_json --key_file related_tags.txt --template_file taginfo_template.json > taginfo.json
*/
class Gen_taginfo_json extends mcli.CommandLine {
    /**
        Verbose output.
    **/
    public var verbose:Bool;

    /**
        File containing the list of supported keys.
    **/
    public var key_file:String;

    /**
        Template taginfo.json which is used to merge with the list of keys.
    **/
    public var template_file:String;

    /**
        Show this message.
    **/
    public function help() {
        Sys.println(this.showUsage());
        Sys.exit(0);
    }

    public function runDefault() {
        if(key_file == null) {
            Sys.println(this.showUsage());
            Sys.println('Missing required arguments: --key_file');
            Sys.exit(0);
        }

        var keys = new Array<String>();

        var key_fh = sys.io.File.read(key_file, false /* non-binary mode */);
        var osm_key_re = new EReg('^[\\w:_-]+$', "i");
        while (true) {

            var osm_tag_key;
            try {
                osm_tag_key = key_fh.readLine();
            } catch (e:haxe.io.Eof) { break; }
            if (osm_key_re.match(osm_tag_key)) {
                keys.push(osm_tag_key);
            }
        }

        if(template_file != null) {
            var value = sys.io.File.getContent(this.template_file),
                json = haxe.Json.parse(value);
            var key_description:String = "";

            /* Copy JSON TObject to dynamic map because TObject is kind of static. */
            var output_json = new Map<String, Dynamic>();
            for (key in Reflect.fields(json)) {
                output_json[key] = Reflect.getProperty(json, key);
            }

            if (Std.is(output_json.get('tags')[0], String)) {
                key_description = output_json.get('tags')[0];
                output_json.remove('tags');
            }
            output_json.set('tags', []);
            for (key in keys) {
                var key_entry = new Map<String, String>();
                key_entry['key'] = key;
                if (key_description.length != 0) {
                    key_entry['description'] = key_description;
                }
                var tags = output_json.get('tags');
                tags.push(key_entry);
                output_json.set('tags', tags);
            }
            Sys.println(haxe.Json.stringify(output_json, null, '    '));
        } else {
            trace(keys.join(', '));
        }
    }

    public static function main() {
        new mcli.Dispatch(Sys.args()).dispatch(new Gen_taginfo_json());
    }
}
