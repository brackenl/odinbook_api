var faker = require("faker");

var Post = require("../models/post");
var User = require("../models/user");
var Comment = require("../models/comment");

const users = [];
const posts = [];
const comments = [];

const shuffleArray = (relArr) => {
  const array = [...relArr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateSpecificUser = () => {
  const user = new User({
    first_name: "David",
    last_name: "Smith",
    email: "dsmith@example.com",
    password: "password", // faker.internet.password(),
    profilePicUrl: faker.image.imageUrl(),
    posts: [],
    friends: [],
    friendRequests: [],
  });
  users.push(user);
};

const generateUser = () => {
  const user = new User({
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    email: faker.internet.email(),
    password: "password", // faker.internet.password(),
    profilePicUrl: faker.image.imageUrl(),
    posts: [],
    friends: [],
    friendRequests: [],
  });
  users.push(user);
};

const generateFriends = () => {
  users.forEach((user) => {
    // ("user: ", user._id);
    const usersExcCurrentUser = users.filter((item) => item._id != user._id);
    const shuffledUsers = shuffleArray(usersExcCurrentUser);
    const randSlicedUsers = shuffledUsers.slice(0, 1);
    // ("sliced random users: ", randSlicedUsers);

    user.friends = randSlicedUsers.map((user) => user._id);
    // ("user's friends: ", user.friends);

    randSlicedUsers.forEach((friendedUser) => {
      if (!friendedUser.friends.includes(user._id)) {
        const relIndex = users.findIndex(
          (user) => user._id == friendedUser._id
        );
        users[relIndex].friends.push(user._id);
        // ("friended user's friends: ", users[relIndex].friends);
      }
    });
  });
};

const generatePost = (user) => {
  const post = new Post({
    author: user,
    content: faker.lorem.sentences(),
    timestamp: faker.date.past(2),
    comment: [],
    likes: [],
  });
  posts.push(post);
  user.posts.push(post._id);
};

const addPosts = () => {
  users.forEach((user) => {
    for (let i = 0; i < 3; i++) {
      generatePost(user);
    }
  });
};

const addLikesToPosts = () => {
  posts.forEach((post) => {
    post.author.friends.forEach((friend) => {
      post.likes.push(friend._id);
    });
  });
};

const addCommentsToPosts = () => {
  posts.forEach((post) => {
    post.author.friends.forEach((friend) => {
      const comment = new Comment({
        user: friend._id,
        comment: faker.lorem.sentence(),
        timestamp: new Date(),
        post: post._id,
        likes: [],
      });
      comments.push(comment);
      post.comments.push(comment._id);
    });
  });
};

const addLikesToComments = () => {
  posts.forEach((post) => {
    post.comments.forEach((comment) => {
      const relComment = comments.find((comm) => comm._id === comment);
      post.author.friends.forEach((user) => {
        relComment.likes.push(user._id);
      });
    });
  });
};

const seedDB = async () => {
  generateSpecificUser();

  for (let i = 0; i < 2; i++) {
    generateUser();
  }

  generateFriends();
  addPosts();
  addLikesToPosts();
  addCommentsToPosts();
  addLikesToComments();

  for (user of users) {
    try {
      await user.save();
    } catch (e) {
      e;
    }
  }

  for (post of posts) {
    try {
      await post.save();
    } catch (e) {
      e;
    }
  }

  for (comment of comments) {
    try {
      await comment.save();
    } catch (e) {
      e;
    }
  }
  /*
  users.forEach(async (user) => {
    try {
      await user.save();
    } catch (e) {
      (e);
    }
  });

  posts.forEach(async (post) => {
    try {
      await post.save();
    } catch (e) {
      (e);
    }
  });

  comments.forEach(async (comment) => {
    try {
      await comment.save();
    } catch (e) {
      (e);
    }
  });
  */
  // (users);
  return { users, posts, comments };
};

/*
// GENERATE

for (let i = 0; i < 50; i++) {
  generateUser();
}

generateFriends();
addPosts();
addLikesToPosts();
addCommentsToPosts();
addLikesToComments();

("users: ", users);
("posts: ", posts);
("comments: ", comments);
*/

module.exports = seedDB;
