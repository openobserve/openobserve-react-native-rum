/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { base64 } from '../base64';

describe('base64', () => {
    describe('decode', () => {
        it('decodes a base64 string', () => {
            const input =
                'eyJmZWF0dXJlX2ZsYWdzIjp7fSwidmlldyI6eyJlcnJvciI6eyJjb3VudCI6MH0sImNyYXNoIjp7ImNvdW50IjowfSwiYWN0aW9uIjp7ImNvdW50IjowfSwiZnJ1c3RyYXRpb24iOnsiY291bnQiOjB9LCJmcm96ZW5fZnJhbWUiOnsiY291bnQiOjB9LCJ1cmwiOiJDYXRlZ29yaWVzLXFDWDNibk4zbzhSZ29Oam5BSUVuQSIsImlzX3Nsb3dfcmVuZGVyZWQiOmZhbHNlLCJuYW1lIjoiQ2F0ZWdvcmllcyIsImlzX2FjdGl2ZSI6dHJ1ZSwiY3VzdG9tX3RpbWluZ3MiOnt9LCJpZCI6ImU3NzhjNjFhLThkM2UtNGU1ZC1iZjNhLTEzNTUxNGMzNWIxMSIsImxvbmdfdGFzayI6eyJjb3VudCI6MH0sInRpbWVfc3BlbnQiOjEsInJlc291cmNlIjp7ImNvdW50IjowfX0sImJ1aWxkX3ZlcnNpb24iOiIyMiIsInNlcnZpY2UiOiJjb20ub3Blbm9ic2VydmUuc2hvcGlzdC5yZWFjdC1uYXRpdmUiLCJ2ZXJzaW9uIjoiMjIuMjMuMjYiLCJzZXNzaW9uIjp7ImlkIjoiODhlNGQxNWQtN2ZkYS00MDEyLTllZDktYTNlMmRhZjU5NGYwIiwidHlwZSI6InVzZXIiLCJpc19hY3RpdmUiOnRydWV9LCJkYXRlIjoxNzAxMjUwMTcyMjA2LCJfb28iOnsiZm9ybWF0X3ZlcnNpb24iOjIsInJlcGxheV9zdGF0cyI6e30sInNlc3Npb24iOnsicGxhbiI6MX0sImNvbmZpZ3VyYXRpb24iOnsic2Vzc2lvbl9zYW1wbGVfcmF0ZSI6MTAwfSwiZG9jdW1lbnRfdmVyc2lvbiI6MX0sImFwcGxpY2F0aW9uIjp7ImlkIjoiNjU2YTIzZmYtNDI2Mi00NGRiLTk4OTUtZGYxOGI1MzUwNDE4In0sImNvbnRleHQiOnt9LCJjb25uZWN0aXZpdHkiOnsiaW50ZXJmYWNlcyI6WyJ3aWZpIl0sInN0YXR1cyI6ImNvbm5lY3RlZCJ9LCJkZXZpY2UiOnsiYXJjaGl0ZWN0dXJlIjoiYXJtNjRlIiwidHlwZSI6Im1vYmlsZSIsIm1vZGVsIjoiaVBob25lMTYsMSBTaW11bGF0b3IiLCJicmFuZCI6IkFwcGxlIiwibmFtZSI6ImlQaG9uZSJ9LCJ0eXBlIjoidmlldyIsIm9zIjp7InZlcnNpb24iOiIxNy4wLjEiLCJ2ZXJzaW9uX21ham9yIjoiMTciLCJidWlsZCI6IjIyRzMyMCIsIm5hbWUiOiJpT1MifSwic291cmNlIjoicmVhY3QtbmF0aXZlIn0=';

            expect(base64.decode(input)).toMatchInlineSnapshot(
                '"{"feature_flags":{},"view":{"error":{"count":0},"crash":{"count":0},"action":{"count":0},"frustration":{"count":0},"frozen_frame":{"count":0},"url":"Categories-qCX3bnN3o8RgoNjnAIEnA","is_slow_rendered":false,"name":"Categories","is_active":true,"custom_timings":{},"id":"e778c61a-8d3e-4e5d-bf3a-135514c35b11","long_task":{"count":0},"time_spent":1,"resource":{"count":0}},"build_version":"22","service":"com.openobserve.shopist.react-native","version":"22.23.26","session":{"id":"88e4d15d-7fda-4012-9ed9-a3e2daf594f0","type":"user","is_active":true},"date":1701250172206,"_oo":{"format_version":2,"replay_stats":{},"session":{"plan":1},"configuration":{"session_sample_rate":100},"document_version":1},"application":{"id":"656a23ff-4262-44db-9895-df18b5350418"},"context":{},"connectivity":{"interfaces":["wifi"],"status":"connected"},"device":{"architecture":"arm64e","type":"mobile","model":"iPhone16,1 Simulator","brand":"Apple","name":"iPhone"},"type":"view","os":{"version":"17.0.1","version_major":"17","build":"22G320","name":"iOS"},"source":"react-native"}"'
            );
        });
    });
});
