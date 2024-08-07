export type SoundType = {
    url: string,
    name: string,
    //@ts-ignore
    player?: Howl,
    description: string
}

export class SoundTools {

    static sounds: SoundType[] = [
        {
            url: "assets/mp3/nearby_explosion_with_debris.mp3",
            name: "nearby_explosion_with_debris",
            description: "nahe Explosion mit herabfallenden Trümmern"
        },
        {
            url: "assets/mp3/nearby_explosion.mp3",
            name: "nearby_explosion",
            description: "nahe Explosion"
        },
        {
            url: "assets/mp3/far_bomb.mp3",
            name: "far_bomb",
            description: "fernes Geräusch einer Bombe"
        },
        {
            url: "assets/mp3/cannon_boom.mp3",
            name: "cannon_boom",
            description: "einzelner Kanonendonner"
        },
        {
            url: "assets/mp3/far_explosion.mp3",
            name: "far_explosion",
            description: "ferne Explosion"
        },
        {
            url: "assets/mp3/laser_shoot.mp3",
            name: "laser_shoot",
            description: "Laserschuss (oder was man dafür hält...)"
        },
        {
            url: "assets/mp3/short_bell.mp3",
            name: "short_bell",
            description: "kurzes Klingeln (wie bei alter Landenkasse)"
        },
        {
            url: "assets/mp3/flamethrower.mp3",
            name: "flamethrower",
            description: "Flammenwerfer"
        },
        {
            url: "assets/mp3/digging.mp3",
            name: "digging",
            description: "Geräusch beim Sandschaufeln"
        },
        {
            url: "assets/mp3/short_digging.mp3",
            name: "short_digging",
            description: "kurzes Geräusch beim Sandschaufeln"
        },
        {
            url: "assets/mp3/shoot.mp3",
            name: "shoot",
            description: "Schussgeräusch"
        },
        {
            url: "assets/mp3/short_shoot.mp3",
            name: "short_shoot",
            description: "ein kurzer Schuss"
        },
        {
            url: "assets/mp3/step.mp3",
            name: "step",
            description: "ein Schritt"
        },
        {
            url: "assets/mp3/boulder.mp3",
            name: "boulder",
            description: "Geräusch eines Steins, der auf einen zweiten fällt"
        },
        {
            url: "assets/mp3/pong_d5.wav",
            name: "pong_d",
            description: "Tiefer Pong-Ton"
        },
        {
            url: "assets/mp3/pong_f5.wav",
            name: "pong_f",
            description: "Hoher Pong-Ton"
        },
    ]

    static soundMap: Map<string, SoundType> = new Map();

    static getVolume: () => number = () => {return -1};

    private static isInitialized: boolean = false;

    public static init() {
        let praefix: string = "";
        //@ts-ignore
        if (window.javaOnlineDir != null) {
            //@ts-ignore
            praefix = window.javaOnlineDir;
        }
        if (!SoundTools.isInitialized) {
            SoundTools.isInitialized = true;
            for (let sound of SoundTools.sounds) {
                //@ts-ignore
                sound.player = new Howl({ src: [praefix + sound.url], preload: true })
                SoundTools.soundMap.set(sound.name, sound);
            }
        }

    }

    public static play(name: string) {
        let st: SoundType = SoundTools.soundMap.get(name);
        if (st != null) {
            st.player.play();
        }
    }

    static volumeDetectionRunning: boolean = false;
    public static startDetectingVolume() {
        if(SoundTools.volumeDetectionRunning) return;
        SoundTools.volumeDetectionRunning = true;
        console.log("starting...");
        //@ts-ignore
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        //@ts-ignore
        if (navigator.getUserMedia) {
            //@ts-ignore
            navigator.getUserMedia({
                audio: true
            },
                function (stream) {
                    let audioContext = new AudioContext();
                    let analyser = audioContext.createAnalyser();
                    let microphone = audioContext.createMediaStreamSource(stream);

                    analyser.smoothingTimeConstant = 0.8;
                    analyser.fftSize = 1024;

                    microphone.connect(analyser);

                    SoundTools.getVolume = () => {
                        if(!SoundTools.volumeDetectionRunning) return 0;
                        var times = new Float32Array(analyser.frequencyBinCount);
                        analyser.getFloatTimeDomainData(times);
                        let volume = 0;
                        for (let i = 0; i < times.length; i++) {
                            volume += Math.abs(times[i]);
                        }
                        volume = volume / times.length;
                        return volume;
                    };
                },
                function (err) {
                    console.log("The following error occured: " + err.name)
                });
        } else {
            console.log("getUserMedia not supported");
        }
    }
}

