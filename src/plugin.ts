import streamDeck from "@elgato/streamdeck";
import { JsonFetcherAction } from "./actions/json-fetcher";

streamDeck.actions.registerAction(new JsonFetcherAction());

streamDeck.connect();
