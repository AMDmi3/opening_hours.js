/**
Generate taginfo.json for this project.
See: https://wiki.openstreetmap.org/wiki/Taginfo/Projects
**/
/*
 * haxe -main Gen_taginfo_json -lib mcli -neko hello.n && neko hello --key_file related_tags.txt --template_file taginfo_template.json
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
            if (Std.is(json.tags[0], String)) {
                key_description = json.tags[0];
                untyped {
                    json.tags = new Array<Map<String, String>>();
                    trace(Type.typeof(json.tags));
                }
            }
            for (key in keys) {
                var key_entry = new Map<String, String>();
                key_entry['key'] = key;
                if (key_description.length != 0) {
                    key_entry['description'] = key_description;
                }
                json.tags.push(key_entry);
            }
                trace(json);
        } else {
            trace(keys);
        }
    }

    public static function main() {
        new mcli.Dispatch(Sys.args()).dispatch(new Gen_taginfo_json());
    }
}
