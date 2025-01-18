import dspy

url_to_labels = {
    "https://lu.ma/mw005iqm": {
        "title": "Pitch and Run 730am Thursday Early Bird",
        "non_commercial": 1.0,
        "non_commercial_explanation": "This event is not sponsored by any company, it is a community event",
        "popularity": 1.0,
        "popularity_explanation": "This event is very popular, 259 people are attending",
        "free_admision": 1.0,
        "free_admision_explanation": "This event is completely free to attend",
        "no_additional_expenses": 1.0,
        "no_additional_expenses_explanation": "You don't have to pay for anything",
        "drinks_provided": 0.0,
        "drinks_provided_explanation": "No drinks are provided",
        "food_provided": 0.0,
        "food_provided_explanation": "No food is provided",
        "venue_niceness": 0.0,
        "venue_niceness_explanation": "The venue is outdoors",
        "quietness": 0.5,
        "quietness_explanation": "The event is outdoors, so it's not very quiet",
        "uniqueness": 0.5,
        "uniqueness_explanation": "Running is a unique activity",
        "proximity": 0.8,
        "proximity_explanation": "The event is in Brooklyn nearby Prospect Park a little far from Manhattan",
    },
}


class ScoringCriteria(dspy.Signature):
    """
    Extract contiguous tokens referring to specific people, if any, from a list of string tokens.
    Output a list of tokens. In other words, do not combine multiple tokens into a single value.
    """

    title: str = dspy.InputField(desc="event title")
    description: str = dspy.InputField(desc="event description")
    attendies: str = dspy.InputField(desc="the number of people attending the event")
    promotions: float = dspy.OutputField(
        desc="promotions (0 - no promotions, no links whatsoever, 1 - promotions and links are all over the place, 0.5 - something in the middle)"
    )
    popularity: float = dspy.OutputField(
        desc="popularity (0 - only 1-2 people sign up, nobody knows about this event, 1 - more than 1000+ people are attending, 0.5 - )"
    )
    tickets_cover: float = dspy.OutputField(
        desc="tickets/cover (1 - completely free event, 0 - very expensive $100+ for a ticket, 0.5 - moderately expensive like $20 for, 0.25 - just 1-5$ for a pass, donation based perhaps)"
    )
    food_drinks: float = dspy.OutputField(
        desc="food/drinks (0 - nothing is sponsored, you pay for everything, 1 - lots of foods and drinks provided, 0.5 - could be just drinks provided for instance)"
    )
    venue_niceness: float = dspy.OutputField(
        desc="venue niceness (0 - completely outdoor, 0.25 - indoor, super small, not comfortable place, 0.5 - indoor, okay place, decent bar for instance, 0.75 - pretty cool comfortable venue (a nice office of a small/medium company for instance), 1 - super nice place like the office of google, microsoft, or a luxury rooftop bar)"
    )
    quietness: float = dspy.OutputField(
        desc="quietness (0 - dead silent (nobody speaking), 0.25 - super comfortable (like 2-4 people chatting in quiet place) 0.5 - moderate (lot of people speaking, but you can speak comfortably), 0.75 - loud (very many people are speaking, but you can manage that), 1 - super loud as on the disco party (can’t speak at all, have to scream))"
    )


def main():
    print("Hello, world!")


if __name__ == "__main__":
    main()
